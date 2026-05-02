import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/Authcontext";
import NotificationProvider from "./components/NotificationToast";
import { clearExpiredToken } from "./services/api";
import "./App.css";

function App() {
  clearExpiredToken();
  const token = localStorage.getItem("access") || localStorage.getItem("token");
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider wsToken={token}>
          {({ history, clearHistory }) => (
            <AppRoutes notifHistory={history} clearHistory={clearHistory} />
          )}
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
