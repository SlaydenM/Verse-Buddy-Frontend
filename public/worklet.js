class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input.length > 0) {
      const samples = input[0];
      const buffer = new ArrayBuffer(samples.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < samples.length; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(i * 2, s * 0x7fff, true); // little-endian 16-bit PCM
      }
      this.port.postMessage(buffer); // Send to TS client -> WebSocket -> Python
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
