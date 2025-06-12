const serverConfig = {
  baseUrl: "http://127.0.0.1:8000",
  port: process.env.PORT || 8000,
};
const patientDetails = {
  patientId: "P001",
  patientName: "John Doe",
  files: [
    {
      id: "h1",
      name: "2D Stack",
      type: "stack",
    },
    {
      id: "d3d",
      name: "3D Volume Series",
      type: "volume",
    },
    {
      id: "painting",
      name: "Reference Image",
      type: "image",
    },
  ],
};

module.exports = {
  serverConfig,
  patientDetails,
};
