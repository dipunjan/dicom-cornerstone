import { apiGetFileList } from "@/shared/api";
import RootLayout from "@/layouts/RootLayout";
import { Home } from "@/pages/Home";
import PatientFileViewer from "@/pages/PatientFileViewer";

export const routes = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "patient/:patientId/fileviewer",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        loader: async ({ params }: { params: any }) => {
          const { patientId } = params as { patientId: string };
          return await apiGetFileList(patientId);
        },
        element: <PatientFileViewer />,
      },
    ],
  },
];
