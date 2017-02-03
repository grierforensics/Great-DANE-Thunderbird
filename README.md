# Great DANE Thunderbird Extension

The Great DANE Thunderbird extension integrates the [Great DANE Engine](https://github.com/grierforensics/Great-DANE-Engine) with Mozilla Thunderbird.

Once configured to communicate with a running Great DANE Engine, the plugin will automatically retrieve S/MIME certificates for senders of incoming mail and recipients of outgoing messages.

If S/MIME encryption is enabled in Thunderbird by default and DANE SMIMEA records exist for all recipients of an outgoing message, certificate retrieval and storage and message encryption will occur transparently.

Configure the Great DANE Engine address by navigating to Add-ons -> Great DANE -> Options.

## License

Dual-licensed under Apache License 2.0 and 3-Clause BSD License. See LICENSE.
