import React from 'react';
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";

export async function loader({ params }: LoaderFunctionArgs) {
    if (!params.appID) {
        throw new Response("appID missing", { status: 400 });
    }
    return { appID: parseInt(params.appID, 10) };
}

export function Poll() {
    const { appID } = useLoaderData() as { appID: number };
    return (
        <>
            <p>Hello this is a poll for app {appID}</p>
        </>
  );
}
