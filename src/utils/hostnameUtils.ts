import dns from 'dns';
import { promisify } from 'util';

const resolveHostnames = promisify(dns.resolve4);

/**
 * Checks if ip related to list of hostnames
 * @param hostnames - hostnames to find related ips
 * @param ip - ip to check regarding hostnames related ips
 */
export const ipInHostnames = async (hostnames: string[], ip: string) => {
  // Resolve all the ips which relate in dns to the hostnames
  const ips = [];
  for (const hostname of hostnames) {
    const result = await resolveHostnames(hostname.replace(new RegExp('(https://)'), ''));
    for (const resultIp of result) {
      ips.push(resultIp);
    }
  }

  // Check if the ip in the array of the ips related to the hostnames
  return (ips.indexOf(ip) !== -1);

};
