import {
    ServiceName,
} from "@modules/common"

/** Build application name from service name and ID. */
export const buildAppName = (
    serviceName: ServiceName = ServiceName.Api, 
    id?: string
) => {
    const map = {
        [ServiceName.Api]: "API",
        [ServiceName.Cli]: "CLI",
    }
    const name = map[serviceName]
    return id ? `${name} ${id}` : name
}   