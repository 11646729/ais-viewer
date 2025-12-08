function VesselReport({ vessel }) {
  if (!vessel) {
    return <p className="empty">Waiting for vessel data...</p>
  }

  return (
    <div className="latest-report">
      <h2>Latest Position Report</h2>
      <table>
        <tbody>
          <tr>
            <th>MMSI</th>
            <td>{vessel.mmsi}</td>
          </tr>
          <tr>
            <th>Name</th>
            <td>{vessel.name || "—"}</td>
          </tr>
          <tr>
            <th>Latitude</th>
            <td>{vessel.latitude?.toFixed(5)}</td>
          </tr>
          <tr>
            <th>Longitude</th>
            <td>{vessel.longitude?.toFixed(5)}</td>
          </tr>
          <tr>
            <th>SOG</th>
            <td>{vessel.sog?.toFixed(1)} knots</td>
          </tr>
          <tr>
            <th>COG</th>
            <td>{vessel.cog?.toFixed(1)}°</td>
          </tr>
          <tr>
            <th>Heading</th>
            <td>{vessel.heading}°</td>
          </tr>
          <tr>
            <th>Updated</th>
            <td>{new Date(vessel.updated_at).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default VesselReport
