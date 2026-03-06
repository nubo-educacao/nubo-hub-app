const fs = require('fs');
const path = require('path');

const logError = (msg) => {
    fs.writeFileSync('error.log', msg + '\n', { flag: 'a' });
};

let yaml;
try {
    // Try 1: Standard require
    yaml = require('js-yaml');
} catch (e1) {
    try {
        // Try 2: Relative to script (assuming scripts/ folder)
        yaml = require(path.join(__dirname, '../node_modules/js-yaml'));
    } catch (e2) {
        try {
            // Try 3: Absolute from CWD
            yaml = require(path.join(process.cwd(), 'node_modules/js-yaml'));
        } catch (e3) {
            let msg = 'Failed to load js-yaml from multiple locations:\n';
            msg += '1. "js-yaml": ' + e1.message + '\n';
            msg += '2. "../node_modules/js-yaml": ' + e2.message + '\n';
            msg += '3. "cwd/node_modules/js-yaml": ' + e3.message + '\n';
            msg += 'CWD: ' + process.cwd() + '\n';
            msg += '__dirname: ' + __dirname + '\n';
            msg += 'Require paths: ' + JSON.stringify(module.paths, null, 2) + '\n';
            logError(msg);
            process.exit(1);
        }
    }
}

// ... rest of script ...
const swaggerPath = 'C:\\Users\\Bruno Bogochvol\\Documents\\GitHub\\Nubo\\nubo-hub-app\\docs\\swagger.yaml';
const rpcJsonPath = 'C:\\Users\\Bruno Bogochvol\\.gemini\\antigravity\\brain\\002a1968-050a-4ca5-a8bf-deabb74b2158\\.system_generated\\steps\\75\\output.txt';

try {
    if (fs.existsSync(swaggerPath)) {
        const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
        const swaggerDoc = yaml.load(swaggerContent);

        const rpcContent = fs.readFileSync(rpcJsonPath, 'utf8');
        const rpcs = JSON.parse(rpcContent);

        if (!swaggerDoc.paths) {
            swaggerDoc.paths = {};
        }

        let addedCount = 0;
        let updatedCount = 0;

        rpcs.forEach(rpc => {
            const functionName = rpc.function_name;
            const pathKey = `/rpc/${functionName}`;
            const args = rpc.arguments ? rpc.arguments.split(', ') : [];

            const parameters = [];
            let requestBody = null;

            if (args.length > 0 && args[0] !== '') {
                const properties = {};
                args.forEach(arg => {
                    const parts = arg.trim().split(' ');
                    let paramName = parts[0];
                    let paramType = parts.slice(1).join(' ');

                    if (!paramType) {
                        paramType = paramName;
                        paramName = `arg_${Object.keys(properties).length + 1}`;
                    }

                    let schemaType = 'string';
                    let schemaFormat = undefined;

                    if (paramType.includes('integer') || paramType.includes('int') || paramType.includes('smallint') || paramType.includes('bigint')) {
                        schemaType = 'integer';
                    } else if (paramType.includes('numeric') || paramType.includes('double') || paramType.includes('float')) {
                        schemaType = 'number';
                    } else if (paramType.includes('boolean') || paramType.includes('bool')) {
                        schemaType = 'boolean';
                    } else if (paramType.includes('json') || paramType.includes('jsonb')) {
                        schemaType = 'object';
                    } else if (paramType.includes('uuid')) {
                        schemaType = 'string';
                        schemaFormat = 'uuid';
                    } else if (paramType.includes('timestamp') || paramType.includes('date')) {
                        schemaType = 'string';
                        schemaFormat = 'date-time';
                    } else if (paramType.includes('[]')) {
                        schemaType = 'array';
                    }

                    properties[paramName] = {
                        type: schemaType,
                        format: schemaFormat
                    };

                    if (schemaType === 'array') {
                        properties[paramName].items = { type: 'string' };
                    }
                });

                requestBody = {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: properties
                            }
                        }
                    }
                };
            }

            const description = rpc.comments || `Calls the ${functionName} RPC function`;

            const newPathItem = {
                post: {
                    summary: functionName,
                    description: description,
                    operationId: functionName,
                    requestBody: requestBody,
                    responses: {
                        '200': {
                            description: 'OK',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'string'
                                    }
                                }
                            }
                        }
                    }
                }
            };

            if (!swaggerDoc.paths[pathKey]) {
                swaggerDoc.paths[pathKey] = newPathItem;
                addedCount++;
            } else {
                swaggerDoc.paths[pathKey] = newPathItem;
                updatedCount++;
            }
        });

        const newSwaggerContent = yaml.dump(swaggerDoc, {
            noRefs: true,
            lineWidth: -1
        });

        fs.writeFileSync(swaggerPath, newSwaggerContent, 'utf8');

        console.log(`Success! Added ${addedCount} new paths. Updated ${updatedCount} paths.`);
    } else {
        logError('Swagger file not found at: ' + swaggerPath);
        process.exit(1);
    }

} catch (e) {
    logError('Error updating swagger: ' + e.message + '\nStack: ' + e.stack);
    process.exit(1);
}
