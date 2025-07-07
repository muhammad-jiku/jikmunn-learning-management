import Footer from '@/components/shared/Footer';
import NonDashboardNavbar from '@/components/shared/NonDashboardNavbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='nondashboard-layout'>
      <NonDashboardNavbar />
      <main className='nondashboard-layout__main'>{children}</main>
      <Footer />
    </div>
  );
}
