export namespace MediaRawEvents {
  export interface MediaGatewayPacket {
    op: number,
    d: any,
  }

  export interface ClientsConnect {
    user_ids: Array<string>,
  }

  export interface ClientConnect {
    audio_ssrc: number,
    streams?: Array<Stream>,
    user_id: string,
    video_ssrc: number,
  }

  // one simulcast layer of a user's video, `quality` is 0-100 (100 being the full resolution layer)
  export interface Stream {
    active?: boolean,
    max_bitrate?: number,
    max_framerate?: number,
    max_resolution?: {
      height: number,
      type: string,
      width: number,
    },
    quality?: number,
    rid?: string,
    rtx_ssrc?: number,
    ssrc?: number,
    type: string,
  }

  export interface ClientDisconnect {
    user_id: string,
  }

  export interface Speaking {
    speaking: number,
    ssrc: number,
    user_id: string,
  }
}
