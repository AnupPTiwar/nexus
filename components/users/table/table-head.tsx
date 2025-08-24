"use client";

import { Table } from "@mantine/core";

export function TableHead() {
    return (
        <Table.Thead>
            <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Permissions</Table.Th>
                <Table.Th>Last Login</Table.Th>
                <Table.Th>Repositories</Table.Th>
                <Table.Th>Workflow Runs</Table.Th>
                <Table.Th>Actions</Table.Th>
            </Table.Tr>
        </Table.Thead>
    );
}