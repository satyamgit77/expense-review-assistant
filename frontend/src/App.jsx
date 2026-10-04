// import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
// import { AuthProvider } from "./context/AuthContext";
// import { useAuth } from "./context/useAuth";
// import ProtectedRoute from "./components/ProtectedRoute";
// import Layout from "./components/Layout";
// import LoginPage from "./pages/LoginPage";
// import MyClaimsPage from "./pages/MyClaimsPage";
// import SubmitClaimPage from "./pages/SubmitClaimPage";
// import ClaimDetailPage from "./pages/ClaimDetailPage";
// import ReviewerDashboardPage from "./pages/ReviewerDashboardPage";

// // "/" par role ke hisaab se sahi page par bhejo
// function RoleRedirect() {
//   const { user } = useAuth();
//   return (
//     <Navigate to={user.role === "reviewer" ? "/review" : "/claims"} replace />
//   );
// }

// export default function App() {
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <Routes>
//           <Route path="/login" element={<LoginPage />} />

//           <Route
//             element={
//               <ProtectedRoute>
//                 <Layout />
//               </ProtectedRoute>
//             }
//           >
//             <Route index element={<RoleRedirect />} />
//             <Route
//               path="claims"
//               element={
//                 <ProtectedRoute roles={["employee"]}>
//                   <MyClaimsPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="claims/new"
//               element={
//                 <ProtectedRoute roles={["employee"]}>
//                   <SubmitClaimPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="review"
//               element={
//                 <ProtectedRoute roles={["reviewer"]}>
//                   <ReviewerDashboardPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route path="claims/:id" element={<ClaimDetailPage />} />
//           </Route>

//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }



import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MyClaimsPage from './pages/MyClaimsPage';
import SubmitClaimPage from './pages/SubmitClaimPage';
import ClaimDetailPage from './pages/ClaimDetailPage';
import ReviewerDashboardPage from './pages/ReviewerDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="claims"
              element={
                <ProtectedRoute roles={['employee']}>
                  <MyClaimsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="claims/new"
              element={
                <ProtectedRoute roles={['employee']}>
                  <SubmitClaimPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="review"
              element={
                <ProtectedRoute roles={['reviewer']}>
                  <ReviewerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="claims/:id" element={<ClaimDetailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}