const fs = require('fs');
const path = 'c:/Saas/src/pages/Admin/SaaSAdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update the grid view meta-grid to show real limits instead of dummy users/rev
content = content.replace(
    /<h3>\{plan\.name\}<\/h3>\s*<span className="card-role-badge"[\s\S]*?\{plan\.price\}[\s\S]*?<\/span>[\s\S]*?<div className="card-meta-grid">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
    `<h3>{plan.name}</h3>
                              <span className="card-role-badge" style={{ color: '#f59e0b', background: '#fffbeb' }}>
                                {plan.price_formatted || plan.price}
                              </span>
                            </div>

                            <div className="card-meta-grid">
                              <div className="meta-item">
                                <Users size={14} className="meta-icon" style={{ color: '#f59e0b' }} />
                                <span>Límit: {plan.users_limit || '∞'} Users</span>
                              </div>
                              <div className="meta-item">
                                <HardDrive size={14} className="meta-icon" style={{ color: '#f59e0b' }} />
                                <span>Storage: {plan.storage_gb || '0'} GB</span>
                              </div>
                              <div className="meta-item">
                                <CheckCircle size={14} className="meta-icon" style={{ color: '#f59e0b' }} />
                                <span>{plan.features?.length || 0} Recursos inclusos</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>`
);

fs.writeFileSync(path, content);
console.log('Successfully updated plans grid view with real data fields');
