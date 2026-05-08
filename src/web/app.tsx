import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
// Agent feedback removed
import Toaster from "./components/ui/Toast";
import AdminGuard from "./components/AdminGuard";

import SignIn from "./pages/sign-in";
import Bootstrap from "./pages/bootstrap";
import Dashboard from "./pages/dashboard";
import Events from "./pages/events";
import Leads from "./pages/leads";
import Contracts from "./pages/contracts";
import Invoices from "./pages/invoices";
import Customers from "./pages/customers";
import Contractors from "./pages/contractors";
import Workflows from "./pages/workflows";
import Messaging from "./pages/messaging";
import SongRequests from "./pages/song-requests";
import Forms from "./pages/forms";
import Packages from "./pages/packages";
import Team from "./pages/team";
import Analytics from "./pages/analytics";
import CalendarPage from "./pages/calendar";
import Appointments from "./pages/appointments";
import Settings from "./pages/settings";

// Customer Portal — no auth guard
import Portal from "./pages/portal/index";
import PortalSign from "./pages/portal/sign";
import PortalPay from "./pages/portal/pay";
import PortalRequests from "./pages/portal/requests";

function App() {
  return (
    <Provider>
      <Switch>
        {/* Public */}
        <Route path="/sign-in" component={SignIn} />
        <Route path="/setup" component={Bootstrap} />

        {/* Customer Portal — public, no guard */}
        <Route path="/portal" component={Portal} />
        <Route path="/portal/sign/:id" component={PortalSign} />
        <Route path="/portal/pay/:token" component={PortalPay} />
        <Route path="/portal/requests" component={PortalRequests} />

        {/* CRM — admin only */}
        <Route path="/">
          <AdminGuard><Dashboard /></AdminGuard>
        </Route>
        <Route path="/events">
          <AdminGuard><Events /></AdminGuard>
        </Route>
        <Route path="/leads">
          <AdminGuard><Leads /></AdminGuard>
        </Route>
        <Route path="/contracts">
          <AdminGuard><Contracts /></AdminGuard>
        </Route>
        <Route path="/invoices">
          <AdminGuard><Invoices /></AdminGuard>
        </Route>
        <Route path="/customers">
          <AdminGuard><Customers /></AdminGuard>
        </Route>
        <Route path="/contractors">
          <AdminGuard><Contractors /></AdminGuard>
        </Route>
        <Route path="/workflows">
          <AdminGuard><Workflows /></AdminGuard>
        </Route>
        <Route path="/messaging">
          <AdminGuard><Messaging /></AdminGuard>
        </Route>
        <Route path="/song-requests">
          <AdminGuard><SongRequests /></AdminGuard>
        </Route>
        <Route path="/forms">
          <AdminGuard><Forms /></AdminGuard>
        </Route>
        <Route path="/packages">
          <AdminGuard><Packages /></AdminGuard>
        </Route>
        <Route path="/team">
          <AdminGuard><Team /></AdminGuard>
        </Route>
        <Route path="/analytics">
          <AdminGuard><Analytics /></AdminGuard>
        </Route>
        <Route path="/calendar">
          <AdminGuard><CalendarPage /></AdminGuard>
        </Route>
        <Route path="/appointments">
          <AdminGuard><Appointments /></AdminGuard>
        </Route>
        <Route path="/settings">
          <AdminGuard><Settings /></AdminGuard>
        </Route>
      </Switch>

      <Toaster />
      {import.meta.env.DEV && <AgentFeedback />}
    </Provider>
  );
}

export default App;
