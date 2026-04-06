const { NextResponse } = require('next/server');
const { client } = require('../../../../../utils/database');

export async function GET(req, { params }) {
    const { id } = params;

    const query = `
        SELECT 
            rfqs.id,
            rfqs.title,
            rfqs.reference_number,
            rfqs.status,
            rfqs.deadline,
            rfqs.currency,
            COALESCE(bids.payment_terms, '') AS payment_terms,
            COALESCE(bids.freight_charges, '') AS freight_charges,
            COALESCE(bids.last_remarks, '') AS last_remarks
        FROM rfqs
        LEFT JOIN bids ON bids.rfq_id = rfqs.id
        WHERE rfqs.id = $1
    `;

    const values = [id];

    try {
        const { rows } = await client.query(query, values);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database query error:', error);
        return NextResponse.error();
    }
}