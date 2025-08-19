import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTypedSelector } from "@/app/hook";
import useBillingSubscription from "@/hooks/use-billing-subscription";
import { AUTH_ROUTES, PROTECTED_ROUTES } from "@/routes/common/routePath";
import { cn } from "@/lib/utils";

interface ProtectedLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  isNavLink?: boolean;
  end?: boolean;
}

export const ProtectedLink = ({ 
    to, 
  children, 
  className = "", 
  activeClassName = "",
  isNavLink = false,
  end = false,
  ...props 
 }: ProtectedLinkProps) => {
  const navigate = useNavigate();
  const { accessToken } = useTypedSelector((state) => state.auth);
  const { isPro, isTrialActive } = useBillingSubscription(accessToken);

  const handleClick = (e: React.MouseEvent) => {
    if (!accessToken) {
      e.preventDefault();
      navigate(AUTH_ROUTES.SIGN_IN);
      return;
    }

    if (!isPro && !isTrialActive && to !== PROTECTED_ROUTES.SETTINGS_BILLING) {
      e.preventDefault();
      navigate(PROTECTED_ROUTES.SETTINGS_BILLING);
      return;
    }
  };

  if (isNavLink) {
    return (
      <NavLink
        to={to}
        onClick={handleClick}
        className={({ isActive }) => 
          cn(
            className,
            isActive && activeClassName
          )
        }
        end={end}
        {...props}
      >
        {children}
      </NavLink>
    );
  }

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </Link>
  );
};

export const ProtectedNavLink = (props: Omit<ProtectedLinkProps, 'isNavLink'>) => (
    <ProtectedLink {...props} isNavLink />
  );