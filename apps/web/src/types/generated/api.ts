export interface paths {
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Check API health */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["HealthResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Authenticate a user */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["LoginRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AuthResponse"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Register an administrative user
         * @description Requires one of these roles: ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["RegisterRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AuthResponse"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/clients/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Check clients module health */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ModuleHealthResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/clients": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List clients */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ClientListResponse"];
                    };
                };
            };
        };
        put?: never;
        /** Create a client */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateClientRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ClientResponse"];
                    };
                };
                400: components["responses"]["BadRequest"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/clients/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        /** Get a client */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ClientResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update a client */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateClientRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ClientResponse"];
                    };
                };
                400: components["responses"]["BadRequest"];
                404: components["responses"]["NotFound"];
            };
        };
        trace?: never;
    };
    "/coaches/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Check coaches module health */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ModuleHealthResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/coaches": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List coaches */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CoachListResponse"];
                    };
                };
            };
        };
        put?: never;
        /** Create a coach */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateCoachRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CoachResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/coaches/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        /** Get a coach */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CoachResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update a coach */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateCoachRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CoachResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/coaches/{coachId}/schedules": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                coachId: number;
            };
            cookie?: never;
        };
        /**
         * List the weekly schedule of a coach
         * @description Requires one of these roles: ADMIN, RECEPTION, COACH
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    coachId: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CoachScheduleListResponse"];
                    };
                };
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
            };
        };
        put?: never;
        /**
         * Add a weekly schedule slot for a coach
         * @description Requires one of these roles: ADMIN, RECEPTION
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    coachId: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateCoachScheduleRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CoachScheduleResponse"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/coaches/{coachId}/schedules/{scheduleId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                coachId: number;
                scheduleId: number;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete a coach schedule slot
         * @description Requires one of these roles: ADMIN, RECEPTION
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    coachId: number;
                    scheduleId: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Schedule slot deleted */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
            };
        };
        options?: never;
        head?: never;
        /**
         * Update a coach schedule slot
         * @description Requires one of these roles: ADMIN, RECEPTION
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    coachId: number;
                    scheduleId: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateCoachScheduleRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CoachScheduleResponse"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
            };
        };
        trace?: never;
    };
    "/memberships": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List memberships
         * @description Requires one of these roles: ADMIN, RECEPTION, CLIENT
         */
        get: {
            parameters: {
                query?: {
                    includeInactive?: boolean;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MembershipListResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Create a membership
         * @description Requires one of these roles: ADMIN, RECEPTION
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateMembershipRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MembershipResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/memberships/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        /**
         * Get a membership
         * @description Requires one of these roles: ADMIN, RECEPTION, CLIENT
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MembershipResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update a membership
         * @description Requires one of these roles: ADMIN, RECEPTION
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateMembershipRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MembershipResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/memberships/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Change membership status
         * @description Requires one of these roles: ADMIN
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["MembershipStatusRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MembershipResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/memberships/{id}/subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create a subscription
         * @description Requires one of these roles: ADMIN, RECEPTION, CLIENT
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateSubscriptionRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SubscriptionWithCheckoutResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List subscriptions
         * @description Requires one of these roles: ADMIN, RECEPTION, CLIENT
         */
        get: {
            parameters: {
                query?: {
                    clientId?: number;
                    status?: components["schemas"]["SubscriptionStatus"];
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SubscriptionListResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/subscriptions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        /**
         * Get a subscription
         * @description Requires one of these roles: ADMIN, RECEPTION, CLIENT
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SubscriptionResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/subscriptions/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cancel a subscription
         * @description Requires one of these roles: ADMIN, RECEPTION
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SubscriptionResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/subscriptions/{id}/payment-confirmation": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Confirm a manual payment
         * @description Requires one of these roles: ADMIN, RECEPTION
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SubscriptionResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attendance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List attendance records
         * @description Requires one of these roles: ADMIN, RECEPTION, CLIENT
         */
        get: {
            parameters: {
                query?: {
                    clientId?: number;
                    from?: string;
                    to?: string;
                    open?: boolean;
                    page?: number;
                    limit?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AttendancePageResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attendance/check-in": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Check in a client
         * @description Requires one of these roles: ADMIN, RECEPTION, CLIENT
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CheckInRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AttendanceResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attendance/{id}/check-out": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Check out a client
         * @description Requires one of these roles: ADMIN, RECEPTION, CLIENT
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AttendanceResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/routines": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List routines */
        get: {
            parameters: {
                query?: {
                    includeInactive?: boolean;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RoutineListResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Create a routine
         * @description Requires one of these roles: ADMIN, COACH
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateRoutineRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RoutineResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/routines/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        /** Get a routine */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RoutineResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update a routine
         * @description Requires one of these roles: ADMIN, COACH
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateRoutineRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RoutineResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/routines/exercises": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List exercises */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExerciseListResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Create an exercise
         * @description Requires one of these roles: ADMIN, COACH
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateExerciseRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExerciseResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/routines/exercises/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        /** Get an exercise */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExerciseResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update an exercise
         * @description Requires one of these roles: ADMIN, COACH
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateExerciseRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExerciseResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/routines/assignments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List routine assignments */
        get: {
            parameters: {
                query?: {
                    clientId?: number;
                    status?: "ACTIVE" | "COMPLETED" | "CANCELLED";
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AssignmentListResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Assign a routine
         * @description Requires one of these roles: ADMIN, COACH
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateAssignmentRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AssignmentResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/routines/assignments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        /** Get a routine assignment */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AssignmentResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/routines/assignments/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Update assignment status
         * @description Requires one of these roles: ADMIN, COACH
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["AssignmentStatusRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AssignmentResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/routines/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Change routine status
         * @description Requires one of these roles: ADMIN, COACH
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["RoutineStatusRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RoutineResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/routines/{id}/exercises": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Add an exercise to a routine
         * @description Requires one of these roles: ADMIN, COACH
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateRoutineExerciseRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RoutineExerciseResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/routines/{id}/exercises/{routineExerciseId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
                routineExerciseId: number;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Remove an exercise from a routine
         * @description Requires one of these roles: ADMIN, COACH
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                    routineExerciseId: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Exercise removed */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Update a routine exercise
         * @description Requires one of these roles: ADMIN, COACH
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                    routineExerciseId: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateRoutineExerciseRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RoutineExerciseResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/progress": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List progress records */
        get: {
            parameters: {
                query?: {
                    clientId?: number;
                    from?: string;
                    to?: string;
                    page?: number;
                    limit?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProgressPageResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Create a progress record
         * @description Requires one of these roles: ADMIN, COACH, CLIENT
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateProgressRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProgressResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/progress/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        /** Get a progress record */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProgressResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stats/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get administrative dashboard statistics
         * @description Requires one of these roles: ADMIN, RECEPTION
         */
        get: {
            parameters: {
                query?: {
                    from?: string;
                    to?: string;
                    timezone?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["DashboardStatsResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stats/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Request an administrative report
         * @description Requires one of these roles: ADMIN, RECEPTION
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["ReportRequest"];
                };
            };
            responses: {
                /** @description Successful response */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ReportRequestResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stats/reports/{jobId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jobId: string;
            };
            cookie?: never;
        };
        /**
         * Get the status of an administrative report
         * @description Requires one of these roles: ADMIN, RECEPTION
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    jobId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ReportStatusResponse"];
                    };
                };
                404: components["responses"]["NotFound"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List payments
         * @description Requires one of these roles: ADMIN, RECEPTION
         */
        get: {
            parameters: {
                query?: {
                    clientId?: number;
                    subscriptionId?: number;
                    method?: components["schemas"]["PaymentMethod"];
                    status?: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PaymentListResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        /**
         * Get a payment
         * @description Requires one of these roles: ADMIN, RECEPTION
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PaymentResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/webhook": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Receive Stripe webhook events */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            responses: {
                /** @description Webhook accepted */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                400: components["responses"]["BadRequest"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AuthenticatedUser: {
            id: string;
            /** Format: email */
            email: string;
            /** @enum {string} */
            role: "ADMIN" | "RECEPTION" | "COACH" | "CLIENT";
            clientId: number | null;
            coachId: number | null;
        };
        ReportStatusResponse: {
            jobId: string;
            /** @example dashboard-summary */
            reportType: string;
            /** @enum {string} */
            status: "pending" | "completed" | "failed";
            /** Format: date-time */
            requestedAt?: string | null;
            /** Format: date-time */
            finishedAt?: string | null;
            result?: components["schemas"]["DashboardStatsResponse"];
            error?: string | null;
        };
        HealthResponse: {
            /** @example ok */
            status: string;
        };
        ModuleHealthResponse: {
            /** @example ok */
            status: string;
            module: string;
        };
        LoginRequest: {
            /** Format: email */
            email: string;
            password: string;
        };
        RegisterRequest: {
            /** Format: email */
            email: string;
            password: string;
            /** @enum {string} */
            role: "ADMIN" | "RECEPTION";
        };
        AuthResponse: {
            accessToken: string;
            user: components["schemas"]["AuthenticatedUser"];
        };
        CreateClientRequest: {
            /** Format: email */
            email: string;
            password?: string;
            dni: string;
            name: string;
            lastName: string;
            phone: string;
        };
        UpdateClientRequest: {
            /** Format: email */
            email?: string;
            dni?: string;
            name?: string;
            lastName?: string;
            phone?: string;
        };
        ClientResponse: {
            id: number;
            /** Format: email */
            email: string;
            dni: string;
            name: string;
            lastName: string;
            phone: string;
            isActive: boolean;
            /** Format: date-time */
            createdAt: string;
        };
        ClientListResponse: components["schemas"]["ClientResponse"][];
        AttendancePageResponse: {
            items: components["schemas"]["AttendanceResponse"][];
            page: number;
            limit: number;
            total: number;
        };
        ProgressPageResponse: {
            items: components["schemas"]["ProgressResponse"][];
            page: number;
            limit: number;
            total: number;
        };
        /** @description clientId is required for ADMIN and RECEPTION callers and omitted for CLIENT callers. */
        CheckInRequest: {
            clientId?: number;
        };
        CoachScheduleResponse: {
            id: number;
            coachId: number;
            /** @description 1 = Monday, 7 = Sunday */
            dayOfWeek: number;
            /** @example 08:00 */
            startTime: string;
            /** @example 16:00 */
            endTime: string;
        };
        CoachScheduleListResponse: components["schemas"]["CoachScheduleResponse"][];
        CreateCoachScheduleRequest: {
            dayOfWeek: number;
            /** @example 08:00 */
            startTime: string;
            /** @example 16:00 */
            endTime: string;
        };
        UpdateCoachScheduleRequest: {
            dayOfWeek?: number;
            startTime?: string;
            endTime?: string;
        };
        CoachResponse: {
            id: number;
            /** Format: email */
            email: string;
            dni: string;
            name: string;
            lastName: string;
            phone: string;
            isActive: boolean;
        };
        CoachListResponse: components["schemas"]["CoachResponse"][];
        CreateCoachRequest: {
            /** Format: email */
            email: string;
            dni: string;
            name: string;
            lastName: string;
            phone: string;
        };
        UpdateCoachRequest: {
            /** Format: email */
            email?: string;
            dni?: string;
            name?: string;
            lastName?: string;
            phone?: string;
        };
        MembershipResponse: {
            id: number;
            name: string;
            description: string | null;
            durationDays: number;
            maxDaysPerWeek: number | null;
            priceAmount: number;
            currency: string;
            isActive: boolean;
            stripePriceId: string | null;
        };
        MembershipListResponse: components["schemas"]["MembershipResponse"][];
        CreateMembershipRequest: {
            name: string;
            description?: string | null;
            durationDays: number;
            maxDaysPerWeek?: number | null;
            priceAmount: number;
            currency?: string;
            stripePriceId?: string | null;
        };
        UpdateMembershipRequest: {
            name?: string;
            description?: string | null;
            durationDays?: number;
            maxDaysPerWeek?: number | null;
            priceAmount?: number;
        };
        MembershipStatusRequest: {
            isActive: boolean;
        };
        /** @enum {string} */
        SubscriptionStatus: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
        /** @enum {string} */
        PaymentMethod: "CARD" | "CASH" | "TRANSFER";
        CreateSubscriptionRequest: {
            clientId: number;
            membershipId: number;
            method: components["schemas"]["PaymentMethod"];
        };
        SubscriptionResponse: {
            id: number;
            clientId: number;
            membershipId: number;
            status: components["schemas"]["SubscriptionStatus"];
            /** Format: date-time */
            startDate: string | null;
            /** Format: date-time */
            endDate: string | null;
            /** Format: date-time */
            createdAt: string;
        };
        SubscriptionWithCheckoutResponse: components["schemas"]["SubscriptionResponse"] & {
            /** Format: uri */
            checkoutUrl: string | null;
        };
        SubscriptionListResponse: components["schemas"]["SubscriptionResponse"][];
        AttendanceResponse: {
            id: number;
            clientId: number;
            subscriptionId: number;
            /** Format: date-time */
            checkInAt: string;
            /** Format: date-time */
            checkOutAt: string | null;
            recordedById: number | null;
        };
        ExerciseResponse: {
            id: number;
            name: string;
            /** @enum {string} */
            muscleGroup: "CHEST" | "BACK" | "SHOULDERS" | "ARMS" | "LEGS" | "GLUTES" | "CORE" | "CARDIO" | "FULL_BODY";
            equipment: string | null;
            description: string | null;
        };
        ExerciseListResponse: components["schemas"]["ExerciseResponse"][];
        CreateExerciseRequest: {
            name: string;
            /** @enum {string} */
            muscleGroup: "CHEST" | "BACK" | "SHOULDERS" | "ARMS" | "LEGS" | "GLUTES" | "CORE" | "CARDIO" | "FULL_BODY";
            equipment?: string | null;
            description?: string | null;
        };
        UpdateExerciseRequest: {
            name?: string;
            /** @enum {string} */
            muscleGroup?: "CHEST" | "BACK" | "SHOULDERS" | "ARMS" | "LEGS" | "GLUTES" | "CORE" | "CARDIO" | "FULL_BODY";
            equipment?: string | null;
            description?: string | null;
        };
        RoutineExerciseResponse: {
            id: number;
            routineId: number;
            exerciseId: number;
            dayNumber: number;
            position: number;
            sets: number;
            reps: number;
            weightKg: string | null;
            restSeconds: number | null;
            notes: string | null;
            exercise?: components["schemas"]["ExerciseResponse"];
        };
        RoutineResponse: {
            id: number;
            name: string;
            description: string | null;
            /** @enum {string} */
            level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
            createdById: number;
            isActive: boolean;
            /** Format: date-time */
            createdAt: string;
            exercises?: components["schemas"]["RoutineExerciseResponse"][];
        };
        RoutineListResponse: components["schemas"]["RoutineResponse"][];
        CreateRoutineRequest: {
            name: string;
            description?: string | null;
            /** @enum {string} */
            level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
            createdById?: number;
            exercises?: components["schemas"]["CreateRoutineExerciseRequest"][];
        };
        UpdateRoutineRequest: {
            name?: string;
            description?: string | null;
            /** @enum {string} */
            level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
        };
        CreateRoutineExerciseRequest: {
            exerciseId: number;
            dayNumber: number;
            position: number;
            sets: number;
            reps: number;
            weightKg?: number | null;
            restSeconds?: number | null;
            notes?: string | null;
        };
        UpdateRoutineExerciseRequest: {
            exerciseId?: number;
            dayNumber?: number;
            position?: number;
            sets?: number;
            reps?: number;
            weightKg?: number | null;
            restSeconds?: number | null;
            notes?: string | null;
        };
        AssignmentResponse: {
            id: number;
            clientId: number;
            routineId: number;
            assignedById: number;
            /** @enum {string} */
            status: "ACTIVE" | "COMPLETED" | "CANCELLED";
            /** Format: date */
            startDate: string;
            /** Format: date */
            endDate: string | null;
            notes: string | null;
        };
        AssignmentListResponse: components["schemas"]["AssignmentResponse"][];
        CreateAssignmentRequest: {
            clientId?: number;
            routineId: number;
            assignedById?: number;
            /** Format: date */
            startDate: string;
            /** Format: date */
            endDate?: string | null;
            notes?: string | null;
        };
        AssignmentStatusRequest: {
            /** @enum {string} */
            status: "COMPLETED" | "CANCELLED";
        };
        RoutineStatusRequest: {
            isActive: boolean;
        };
        ProgressResponse: {
            id: number;
            clientId: number;
            recordedById: number | null;
            /** Format: date */
            measuredAt: string;
            weightKg: number | null;
            heightCm: number | null;
            bodyFatPct: number | null;
            muscleKg: number | null;
            chestCm: number | null;
            waistCm: number | null;
            hipCm: number | null;
            armCm: number | null;
            thighCm: number | null;
            notes: string | null;
        };
        CreateProgressRequest: {
            clientId?: number;
            /** Format: date */
            measuredAt: string;
            weightKg?: number | null;
            heightCm?: number | null;
            bodyFatPct?: number | null;
            muscleKg?: number | null;
            chestCm?: number | null;
            waistCm?: number | null;
            hipCm?: number | null;
            armCm?: number | null;
            thighCm?: number | null;
            notes?: string | null;
        };
        DashboardStatsResponse: {
            period: {
                /** Format: date */
                from: string;
                /** Format: date */
                to: string;
            };
            clients: {
                active: number;
            };
            memberships: {
                active: number;
                expired: number;
            };
            revenue: {
                amount: number;
                currency: string | null;
            };
            attendance: {
                total: number;
            };
            payments: components["schemas"]["PaymentStatusCount"][];
            coachUsage: components["schemas"]["CoachUsage"][];
        };
        PaymentStatusCount: {
            status: string;
            count: number;
            amount: number;
        };
        CoachUsage: {
            coachId: number;
            coachName: string;
            routinesCreated: number;
            routineAssignments: number;
            progressRecords: number;
        };
        ReportRequest: {
            /** @enum {string} */
            reportType: "dashboard-summary";
            /** Format: date */
            from?: string;
            /** Format: date */
            to?: string;
            timezone?: string;
        };
        ReportRequestResponse: {
            jobId: string;
        };
        PaymentResponse: {
            id: number;
            clientId: number;
            subscriptionId: number;
            method: components["schemas"]["PaymentMethod"];
            /** @enum {string} */
            status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
            amount: number;
            currency: string;
            refundedAmount: number;
            /** Format: uri */
            receiptUrl: string | null;
            recordedById: number | null;
            /** Format: date-time */
            paidAt: string | null;
            /** Format: date-time */
            createdAt: string;
        };
        PaymentListResponse: components["schemas"]["PaymentResponse"][];
        ErrorResponse: {
            error: string;
        };
    };
    responses: {
        /** @description Invalid request */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Authentication required */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Insufficient permissions */
        Forbidden: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Resource not found */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Resource conflict */
        Conflict: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
