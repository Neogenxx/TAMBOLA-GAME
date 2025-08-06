export class VoiceAnnouncer {
  private synthesis: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeVoice();
  }

  private initializeVoice() {
    const setVoice = () => {
      const voices = this.synthesis.getVoices();
      // Prefer English voices
      this.voice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
      ) || voices[0] || null;
    };

    if (this.synthesis.getVoices().length > 0) {
      setVoice();
    } else {
      this.synthesis.addEventListener('voiceschanged', setVoice);
    }
  }

  announceNumber(number: number) {
    if (!this.synthesis || !this.voice) return;

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance();
    utterance.text = this.getNumberAnnouncement(number);
    utterance.voice = this.voice;
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

    this.synthesis.speak(utterance);
  }

  announceWinner(type: string, playerName: string) {
    if (!this.synthesis || !this.voice) return;

    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance();
    utterance.text = `Congratulations ${playerName}! ${type} winner!`;
    utterance.voice = this.voice;
    utterance.rate = 0.7;
    utterance.pitch = 1.2;
    utterance.volume = 1;

    this.synthesis.speak(utterance);
  }

  private getNumberAnnouncement(number: number): string {
    const specialNumbers: Record<number, string> = {
      1: "Number one, Nelson's column",
      2: "Number two, one little duck",
      3: "Number three, cup of tea",
      4: "Number four, knock at the door",
      5: "Number five, man alive",
      6: "Number six, half a dozen",
      7: "Number seven, lucky seven",
      8: "Number eight, garden gate",
      9: "Number nine, doctor's orders",
      10: "Number ten, cock and hen",
      11: "Number eleven, legs eleven",
      12: "Number twelve, one dozen",
      13: "Number thirteen, unlucky for some",
      15: "Number fifteen, young and keen",
      16: "Number sixteen, sweet sixteen",
      17: "Number seventeen, dancing queen",
      18: "Number eighteen, coming of age",
      20: "Number twenty, one score",
      21: "Number twenty-one, key of the door",
      22: "Number twenty-two, two little ducks",
      25: "Number twenty-five, quarter century",
      30: "Number thirty, dirty thirty",
      33: "Number thirty-three, two little fleas",
      40: "Number forty, life begins at",
      44: "Number forty-four, all the fours",
      45: "Number forty-five, halfway house",
      50: "Number fifty, half century",
      55: "Number fifty-five, all the fives",
      60: "Number sixty, five dozen",
      66: "Number sixty-six, clickety click",
      70: "Number seventy, three score and ten",
      75: "Number seventy-five, diamond anniversary",
      77: "Number seventy-seven, sunset strip",
      80: "Number eighty, eight and blank",
      88: "Number eighty-eight, two fat ladies",
      90: "Number ninety, top of the shop"
    };

    return specialNumbers[number] || `Number ${number}`;
  }

  stop() {
    this.synthesis.cancel();
  }
}