import { useAuth } from "../context/AuthContext";
import OnboardingModal from "./OnboardingModal";

const OnboardingGate = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (!user.is_verified || !user.name) {
    return <OnboardingModal />;
  }

  return null;
};

export default OnboardingGate;