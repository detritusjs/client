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
    user_id: string,
    video_ssrc: number,
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
