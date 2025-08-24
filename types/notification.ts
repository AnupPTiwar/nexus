// Notification types and tile component contracts

export type NotificationType = "SUCCESS" | "ERROR" | "WARNING" | "INFO";

export type NotificationResourceType = 
    | "REPOSITORY" 
    | "WORKFLOW" 
    | "WORKFLOW_RUN" 
    | "SYNC_JOB" 
    | "USER"
    | "SYSTEM";

export interface NotificationMetadata {
    syncJobId?: string;
    repositoryId?: string;
    workflowId?: string;
    workflowRunId?: string;
    totalProcessed?: number;
    totalFailed?: number;
    error?: string;
    [key: string]: unknown;
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    resourceType: NotificationResourceType;
    resourceId?: string;
    metadata?: NotificationMetadata;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Tile component contracts for different notification types
export interface NotificationTileProps {
    notification: Notification;
    onRead?: (notificationId: string) => void;
    onDismiss?: (notificationId: string) => void;
    onAction?: (notificationId: string, action: string) => void;
    compact?: boolean;
}

export interface NotificationTileConfig {
    type: NotificationType;
    icon: React.ComponentType<{ size?: number }>;
    color: string;
    backgroundColor: string;
    borderColor: string;
    actions?: NotificationAction[];
}

export interface NotificationAction {
    id: string;
    label: string;
    variant: "filled" | "outline" | "subtle";
    color: string;
    icon?: React.ComponentType<{ size?: number }>;
    onClick: (notification: Notification) => void;
}

// Tile templates for different notification scenarios
export interface SyncNotificationTileData extends NotificationTileProps {
    notification: Notification & {
        resourceType: "SYNC_JOB";
        metadata: {
            syncJobId: string;
            repositoryId: string;
            totalProcessed?: number;
            totalFailed?: number;
        };
    };
}

export interface RepositoryNotificationTileData extends NotificationTileProps {
    notification: Notification & {
        resourceType: "REPOSITORY";
        metadata: {
            repositoryId: string;
            repositoryName?: string;
            repositoryOwner?: string;
        };
    };
}

export interface WorkflowNotificationTileData extends NotificationTileProps {
    notification: Notification & {
        resourceType: "WORKFLOW" | "WORKFLOW_RUN";
        metadata: {
            workflowId?: string;
            workflowRunId?: string;
            workflowName?: string;
            repositoryId: string;
            status?: string;
            conclusion?: string;
        };
    };
}

// Notification panel configuration
export interface NotificationPanelConfig {
    maxItems: number;
    autoMarkReadDelay: number;
    groupByType: boolean;
    showTimestamps: boolean;
    enableActions: boolean;
    compactMode: boolean;
}

export interface NotificationFilters {
    types?: NotificationType[];
    resourceTypes?: NotificationResourceType[];
    isRead?: boolean;
    dateRange?: {
        from: Date;
        to: Date;
    };
}

// Real-time notification events for SSE
export interface NotificationEvent {
    type: "notification_created" | "notification_updated" | "notification_deleted";
    notification: Notification;
    userId: string;
}

export interface NotificationStats {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byResourceType: Record<NotificationResourceType, number>;
}