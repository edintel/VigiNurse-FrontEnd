export const ROUTES = {
    auth: {
        login: "/login",
    },
    dashboard: {
        root: "/",
        patients: "/patients",
        vitalsMonitoring: "/vitals-monitoring",
        nurseCalls: "/nurse-calls",
        assetsManagement: "/assets-management",
        medicalImaging: "/medical-imaging",
        staffMonitoring: "/staff-monitoring",
        babyMonitoring: "/baby-monitoring",
        notifications: "/notifications",
    },
} as const;
export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
