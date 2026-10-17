import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/AppShell';
import { EmptyState } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { useT } from '../lib/useT';

export function NotFoundPage() {
  const t = useT();
  return (
    <div className="stack-6">
      {/* Named on screen: not-found is not a navigation entry, so nothing else on the page says
          where the traveller has landed (item A). */}
      <PageHeader title={t('Page not found')} description={t('This page does not exist.')} showTitle />
      <EmptyState
        icon="info"
        title={t('Nothing here')}
        description={t(
          'Use the navigation for the planner, results, stops and departure boards.',
        )}
      >
        <Link to="/" className="btn btn--primary">
          <Icon name="home" size={16} />
          {t('Back to the planner')}
        </Link>
        <Link to="/map" className="btn">
          <Icon name="map" size={16} />
          {t('Network map')}
        </Link>
      </EmptyState>
    </div>
  );
}
