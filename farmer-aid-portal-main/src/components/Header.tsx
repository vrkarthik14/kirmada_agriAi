import {
  Sprout,
  Microscope,
  FileText,
  Megaphone,
  Package,
  User,
  Menu,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const navigationItems = [
  {
    name: 'Crop Planner',
    icon: Sprout,
    href: '#crop-planner',
    action: 'scroll',
  },
  {
    name: 'Disease Detection',
    icon: Microscope,
    href: '#disease-detection',
    action: 'scroll',
  },
  {
    name: 'Govt Schemes',
    icon: FileText,
    href: '#govt-schemes',
    action: 'scroll',
  },
  {
    name: 'My Campaigns',
    icon: Megaphone,
    href: '#campaigns',
    action: 'scroll',
  },
  { name: 'My Orders', icon: Package, href: '#orders', action: 'scroll' },
  { name: 'AgriSangh', icon: Users, href: '#agrisangh', action: 'scroll' },
];

export const Header = () => {
  const { toast } = useToast();

  const handleNavigation = (item: (typeof navigationItems)[0]) => {
    if (item.action === 'scroll') {
      // Smooth scroll to section
      const element = document.querySelector(item.href);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      } else {
        // Show coming soon message for sections that don't exist yet (except govt schemes)
        if (item.name !== 'Govt Schemes') {
          toast({
            title: `${item.name} Coming Soon!`,
            description:
              'This feature is under development and will be available in the next update.',
          });
        }
      }
    }
  };

  const handlePremiumClick = () => {
    toast({
      title: 'Premium Features',
      description:
        'Upgrade to premium for advanced AI features, unlimited campaigns, and priority support!',
    });
  };

  const handleProfileClick = () => {
    toast({
      title: 'User Profile',
      description: 'Profile management and settings coming soon!',
    });
  };

  const handleMobileMenu = () => {
    toast({
      title: 'Mobile Menu',
      description: 'Mobile navigation menu coming soon!',
    });
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md'>
      <div className='container flex h-16 items-center justify-between px-4'>
        {/* Logo Section */}
        <div
          className='flex items-center space-x-2 cursor-pointer'
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary'>
            <Sprout className='h-6 w-6 text-primary-foreground' />
          </div>
          <div className='flex flex-col'>
            <span className='text-lg font-bold text-primary'>AGRI-AI</span>
            <span className='text-xs text-muted-foreground'>Smart Farming</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className='hidden md:flex items-center space-x-1'>
          {navigationItems.map((item) => (
            <Button
              key={item.name}
              variant='ghost'
              size='sm'
              className={cn(
                'flex items-center space-x-2 px-3 py-2 text-sm font-medium',
                'hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer'
              )}
              onClick={() => handleNavigation(item)}
            >
              <item.icon className='h-4 w-4' />
              <span>{item.name}</span>
            </Button>
          ))}
        </nav>

        {/* Profile Section */}
        <div className='flex items-center space-x-4'>
          <Avatar
            className='h-8 w-8 ring-2 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all'
            onClick={handleProfileClick}
          >
            <AvatarFallback className='bg-primary text-primary-foreground text-sm'>
              <User className='h-4 w-4' />
            </AvatarFallback>
          </Avatar>

          {/* Mobile Menu Button */}
          <Button
            variant='ghost'
            size='sm'
            className='md:hidden'
            onClick={handleMobileMenu}
          >
            <Menu className='h-5 w-5' />
          </Button>
        </div>
      </div>
    </header>
  );
};
