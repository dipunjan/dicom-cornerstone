import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Suspense } from "react";
import { routes } from "@/routes";

const router = createBrowserRouter(routes);

function App() {
  return (
    <Suspense fallback={<div>Loading application...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
