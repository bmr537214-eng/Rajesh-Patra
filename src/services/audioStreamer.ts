/**
 * Audio service to handle capture (16kHz PCM16 input)
 * and playback (24kHz PCM16 output) for Gemini Live API.
 */

export class AudioService {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  
  private activeSources: AudioBufferSourceNode[] = [];
  private nextStartTime = 0;
  private isMuted = false;
  private playbackSpeed = 1.0;

  constructor() {}

  /**
   * Initialize and start recording from the microphone
   */
  async startRecording(
    onAudioData: (base64: string) => void,
    onError: (err: any) => void
  ) {
    try {
      this.stopRecording();

      // Request microphone access
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Initialize Input Audio Context
      // Attempt 16kHz context if browser supports it natively, otherwise fall back and resample manually
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioCtxClass({ sampleRate: 16000 });
      
      const actualInputRate = this.inputAudioCtx.sampleRate;
      
      this.micSource = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      
      // Create Input Analyser for visualizing user mic volume
      this.inputAnalyser = this.inputAudioCtx.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.micSource.connect(this.inputAnalyser);

      // Create processor (using 4096 buffer size)
      this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);
      this.micSource.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.inputAudioCtx.destination);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (this.isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Downsample manually to 16kHz if actual context sample rate is different
        const resampledData = this.downsampleBuffer(inputData, actualInputRate, 16000);
        
        // Convert Float32 samples to 16-bit PCM ArrayBuffer
        const pcm16Buffer = this.floatTo16BitPCM(resampledData);
        
        // Convert ArrayBuffer to base64
        const base64Data = this.arrayBufferToBase64(pcm16Buffer);
        onAudioData(base64Data);
      };

    } catch (err) {
      console.error("Failed to start audio recording:", err);
      onError(err);
    }
  }

  /**
   * Stop recording microphone input
   */
  stopRecording() {
    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch (e) {}
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }

    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch (e) {}
      this.micSource = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    if (this.inputAudioCtx && this.inputAudioCtx.state !== "closed") {
      this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }

    this.inputAnalyser = null;
  }

  /**
   * Queue and play 24kHz PCM16 audio response chunks
   */
  playChunk(pcm16Base64: string) {
    try {
      if (!this.outputAudioCtx || this.outputAudioCtx.state === "closed") {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.outputAudioCtx = new AudioCtxClass({ sampleRate: 24000 });
        this.outputAnalyser = this.outputAudioCtx.createAnalyser();
        this.outputAnalyser.fftSize = 256;
        this.outputAnalyser.connect(this.outputAudioCtx.destination);
        this.nextStartTime = 0;
      }

      // Resume context if suspended (browser security policy)
      if (this.outputAudioCtx.state === "suspended") {
        this.outputAudioCtx.resume();
      }

      // 1. Decode base64 to binary
      const binary = atob(pcm16Base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // 2. Convert to Int16Array and then Float32Array
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }

      // 3. Create AudioBuffer (24kHz, mono)
      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      // 4. Create source node
      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = this.playbackSpeed;

      // Connect source to output analyzer and output destination
      if (this.outputAnalyser) {
        source.connect(this.outputAnalyser);
      } else {
        source.connect(this.outputAudioCtx.destination);
      }

      // 5. Schedule precise gapless playback
      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        // If we are behind, schedule shortly in the future to allow queuing
        this.nextStartTime = currentTime + 0.05;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += (audioBuffer.duration / this.playbackSpeed);

      // Keep track of active source for interruption-stopping
      source.onended = () => {
        this.activeSources = this.activeSources.filter((s) => s !== source);
      };
      this.activeSources.push(source);

    } catch (err) {
      console.error("Failed to play audio chunk:", err);
    }
  }

  /**
   * Stop all active speaker nodes immediately on user interruption
   */
  stopPlayback() {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    this.activeSources = [];
    this.nextStartTime = 0;
  }

  /**
   * Returns whether Zoya is currently speaking/playing audio
   */
  isSpeaking(): boolean {
    if (!this.outputAudioCtx) return false;
    return this.outputAudioCtx.currentTime < this.nextStartTime;
  }

  /**
   * Get dynamic volume from input mic or output response for animations
   */
  getVolume(type: "input" | "output"): number {
    const analyser = type === "input" ? this.inputAnalyser : this.outputAnalyser;
    if (!analyser) return 0;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length;
  }

  /**
   * Get raw byte data for full custom visualization
   */
  getWaveformData(type: "input" | "output", array: Uint8Array) {
    const analyser = type === "input" ? this.inputAnalyser : this.outputAnalyser;
    if (!analyser) return;
    analyser.getByteTimeDomainData(array);
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  toggleMuted(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  getMutedState(): boolean {
    return this.isMuted;
  }

  setPlaybackSpeed(speed: number) {
    this.playbackSpeed = speed;
  }

  getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  /**
   * Helper: Manual PCM Downsampling (linear approximation)
   */
  private downsampleBuffer(
    buffer: Float32Array,
    inputRate: number,
    outputRate: number
  ): Float32Array {
    if (inputRate === outputRate) return buffer;
    const sampleRateRatio = inputRate / outputRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  /**
   * Helper: Float32Array to signed 16-bit PCM little-endian
   */
  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      const sample = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(i * 2, sample, true); // true = little-endian
    }
    return buffer;
  }

  /**
   * Helper: ArrayBuffer to Base64 encoding
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
