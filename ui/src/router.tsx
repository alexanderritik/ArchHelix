import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { FailedScreen } from "./pages";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/*",
        element: <FailedScreen message="No Page found" />,
    },
]);