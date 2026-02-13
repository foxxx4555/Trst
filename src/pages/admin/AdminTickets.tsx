import React from 'react';
import { Badge } from 'antd';

const AdminTickets = () => {
    return (
        <div>
            <h1>Admin Tickets</h1>
            <Badge count={0} />  {/* Example of Badge without undefined cn function */}
        </div>
    );
};

export default AdminTickets;
