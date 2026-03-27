import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Profile is now consolidated into Settings. Redirect.
export default function Profile() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/settings', { replace: true });
  }, [navigate]);

  return null;
}
