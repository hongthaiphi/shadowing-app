export async function audioToWav(
  audioBlob: Blob,
  targetSampleRate = 16000
): Promise<ArrayBuffer> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioContext = new AudioContext({ sampleRate: targetSampleRate });
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  if (audioBuffer.sampleRate !== targetSampleRate) {
    return resampleAudio(audioBuffer, targetSampleRate);
  }
  return bufferToWav(audioBuffer);
}

async function resampleAudio(audioBuffer: AudioBuffer, newSampleRate: number): Promise<ArrayBuffer> {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.ceil(audioBuffer.duration * newSampleRate),
    newSampleRate
  );
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  const rendered = await offlineContext.startRendering();
  return bufferToWav(rendered);
}

function bufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numChannels * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels: Float32Array[] = [];
  let pos = 0;

  const setUint16 = (d: number) => { view.setUint16(pos, d, true); pos += 2; };
  const setUint32 = (d: number) => { view.setUint32(pos, d, true); pos += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1);           // PCM
  setUint16(numChannels);
  setUint32(audioBuffer.sampleRate);
  setUint32(audioBuffer.sampleRate * 2 * numChannels);
  setUint16(numChannels * 2);
  setUint16(16);          // 16-bit
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < numChannels; i++) channels.push(audioBuffer.getChannelData(i));

  let offset = 0;
  while (pos < length) {
    for (let i = 0; i < numChannels; i++) {
      let s = Math.max(-1, Math.min(1, channels[i][offset]));
      s = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(pos, s, true);
      pos += 2;
    }
    offset++;
  }

  return buffer;
}
