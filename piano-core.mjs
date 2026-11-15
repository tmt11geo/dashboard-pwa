export const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
export const noteName = midi => ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][midi % 12] + (Math.floor(midi / 12) - 1);
export const isBlack = midi => [1,3,6,8,10].includes(midi % 12);
export function keyboardLayout(start) {
  const notes = Array.from({length:25},(_,i)=>start+i);
  const whites = notes.filter(n=>!isBlack(n)).length;
  let white = 0;
  return notes.map(midi => {
    const black = isBlack(midi);
    const left = black ? (white - .31) / whites * 100 : white++ / whites * 100;
    return {midi,black,left,width:(black ? .62 : 1) / whites * 100};
  });
}
