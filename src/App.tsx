import { useRoutes } from 'react-router-dom';
import { routeConfig } from '@/routes/route-config';

export function App() {
  return useRoutes(routeConfig);
}
