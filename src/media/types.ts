/**
 * Generic Media Gateway Packet
 * @category Media Gateway Packet
 */
export interface MediaGatewayPacket {
  op: number,
  d: any,
}

/**
 * @category Media Gateway Packet
 */
export interface ClientConnect {
  audio_ssrc: number,
  user_id: string,
  video_ssrc: number,
}

/**
 * @category Media Gateway Packet
 */
export interface ClientDisconnect {
  user_id: string,
}

/**
 * @category Media Gateway Packet
 */
export interface Speaking {
  speaking: number,
  ssrc: number,
  user_id: string,
}
