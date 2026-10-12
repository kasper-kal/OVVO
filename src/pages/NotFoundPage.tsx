import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/AppShell';
import { EmptyState } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';

export function NotFoundPage() {
  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader title="Page not found" description="This part of the prototype does not exist." breadcrumbs={[{ label: 'Planner', to: '/' }]} />
      <EmptyState
        icon="info"
        title="Nothing here"
        description="Use the navigation to reach the planner, results, map, stops, departure boards, alerts, favourites, saved journeys, history, preferences or settings."
      >
        <Link to="/" className="btn btn--primary">
          <Icon name="home" size={16} />
          Back to the planner
        </Link>
        <Link to="/map" className="btn">
          <Icon name="map" size={16} />
          Illustrative map
        </Link>
        <Link to="/disruptions" className="btn">
          <Icon name="alert" size={16} />
          Example alerts
        </Link>
      </EmptyState>
    </div>
  );
}
