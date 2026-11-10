import { User, VoiceState } from '../structures';

import { MediaRawEvents } from './rawevents';


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

  export interface Flags {
    // anyone watching their stream may clip it
    allowAnyViewerClips: boolean,
    // they allow their voice in other people's clips
    allowVoiceRecording: boolean,
    clipsEnabled: boolean,
    // `MediaFlags`
    flags: number,
    user: null | User,
    userId: string,
  }

  export interface KeyframeRequest {
    // our video ssrc, a viewer can't decode it until we send a keyframe
    ssrc: number,
  }

  export interface Platform {
    // `MediaPlatforms`, what the user joined from
    platform: number,
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

  export interface VideoCodec {
    // the codec the voice server wants our video in
    codec: string,
  }

  export interface VideoFrame {
    codec: string,
    // the encoded frame, e2e decrypted. h264 comes as annex b, ready for a decoder
    data: Buffer,
    keyframe: boolean,
    ssrc: number,
    // rtp timestamp, video runs on a 90kHz clock
    timestamp: number,
    user: null | User,
    userId: null | string,
  }

  export interface VideoQuality {
    // `off` or `full`, the quality we now get of their video
    quality: string,
    ssrc: number,
    user: null | User,
    userId: string,
  }

  export interface VoiceBackendVersion {
    rtcWorker: string,
    voice: string,
  }

  export interface VideoUpdate {
    // if the user is sending video now, sent again whenever their camera turns on or off
    active: boolean,
    streams: Array<MediaRawEvents.Stream>,
    user: null | User,
    userId: string,
    videoSSRC: number,
  }
}
