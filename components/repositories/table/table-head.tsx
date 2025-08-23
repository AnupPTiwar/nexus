"use client";

import { Table } from "@mantine/core";

export function TableHead() {
    return (
        <Table.Thead>
            <Table.Tr>
                <Table.Th>Repository</Table.Th>
                <Table.Th>Owner</Table.Th>
                <Table.Th>Visibility</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Workflows</Table.Th>
                <Table.Th>Tokens</Table.Th>
                <Table.Th>Last Sync</Table.Th>
                <Table.Th>Actions</Table.Th>
            </Table.Tr>
        </Table.Thead>
    );
}
