import { User, VoiceState } from '../structures';


export namespace MediaEvents {
  export interface ClientConnect {
    audioSSRC: number,
    user: null | User,
    userId: string,
    videoSSRC: number,
  }

  export interface ClientDisconnect {
    user: null | User,
    userId: string,
  }

  export interface Speaking {
    isSpeaking: boolean,
    priority: boolean,
    soundshare: boolean,
    ssrc: number,
    user: null | User,
    userId: string,
    voice: boolean,
    voiceState: null | VoiceState,
  }
}
