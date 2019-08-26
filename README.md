# OSpike
An OAuth2 authorization server supporting OpenID Connect

# Usage
### For first usage please do the following steps:

Clone the project from github and install dependencies:

    git clone https://github.com/rabiran/OSpike.git    
    npm install

After that, in `package.json` file, you'll find 3 `npm` scripts named: `generate-env-[prod/dev/test]`.

Adjust your settings in each one of them for generating appropriate `.env` file for the project.
## Settings:
> `-port`       The port of the server. e.g. `-port 1337`
>
> `-hostname`   The hostname of the project url. e.g. `-hostname google.com`
>
> `-mongoUrl`   The url of the mongo db of the project. e.g. `-mongoUrl ds11232.mlab.com:12345/db_bla_bla`
>
> `-username`   The username of the db. e.g. `-username admin`
>
> `-password`   The password of the db user. e.g. `-password 123456`
> 
> `-hostValidation` Enabling host validation, value should be `0` for disable or `1` for enable. e.g. `-hostValidation 1` 
> 
> `-logsDir` The directory path used for log files. *Default value:* 'logs'. (in the same hierarchy as src)
>
> `-logFileName` The name of the log file. *Default value:* 'ospike-log.txt'
>
>
> *OPTIONAL Settings*:
>
>
> `-apmServiceName` *OPTIONAL: Used in production only* - The Elastic APM service name
>
> `-apmServerUrl` *OPTIONAL: Used in production only* - The Elastic APM server url
>
> `-apmSecretToken` *OPTIONAL: Used in production only* - The secret token for accessing the Elastic APM server

And just run:

    npm run init
    npm start

The `init` script ensures you got all the configuration needed for the project.

**NOTE:** For changing the environment, simply run `npm run generate-env-[prod/dev/test]` for the specific environment.

After that, any time you want to use the project again, simply run `npm start`.
