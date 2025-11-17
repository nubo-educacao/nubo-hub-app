import { Route, Routes } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import OpportunitiesPage from '../pages/OpportunitiesPage';
import OpportunityDetailsPage from '../pages/OpportunityDetailsPage';
import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/oportunidades" element={<OpportunitiesPage />} />
      <Route path="/oportunidades/:id" element={<OpportunityDetailsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
