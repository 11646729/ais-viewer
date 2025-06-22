export type ClientLocationMessage = {
  type: "location-update",
  payload: {
    latitude: number,
    longitude: number,
    radius: number
  }
}