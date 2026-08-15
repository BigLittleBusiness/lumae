import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Features from "./pages/Features";
import Home from "./pages/Home";
import LumaeAppShell from "./components/LumaeAppShell";
import AppWorkspace, { RequireWorkspace } from "./pages/AppWorkspace";
import { ActionQueue, Reporting, ResponseIntelligence, WorkspaceSettings } from "./pages/ResponseIntelligence";
import { SurveyBuilder, SurveyDetail, SurveyList } from "./pages/SurveyStudio";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/features"} component={Features} />
      <Route path={"/app/surveys/new"}><LumaeAppShell><RequireWorkspace><SurveyBuilder /></RequireWorkspace></LumaeAppShell></Route>
      <Route path={"/app/surveys/:id"}><LumaeAppShell><RequireWorkspace><SurveyDetail /></RequireWorkspace></LumaeAppShell></Route>
      <Route path={"/app/surveys"}><LumaeAppShell><RequireWorkspace><SurveyList /></RequireWorkspace></LumaeAppShell></Route>
      <Route path={"/app/responses"}><LumaeAppShell><RequireWorkspace><ResponseIntelligence /></RequireWorkspace></LumaeAppShell></Route>
      <Route path={"/app/actions"}><LumaeAppShell><RequireWorkspace><ActionQueue /></RequireWorkspace></LumaeAppShell></Route>
      <Route path={"/app/reports"}><LumaeAppShell><RequireWorkspace><Reporting /></RequireWorkspace></LumaeAppShell></Route>
      <Route path={"/app/settings"}><LumaeAppShell><RequireWorkspace><WorkspaceSettings /></RequireWorkspace></LumaeAppShell></Route>
      <Route path={"/app"}><LumaeAppShell><AppWorkspace /></LumaeAppShell></Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
