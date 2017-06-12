# Great DANE

<img src="https://tools.greatdanenow.com/GreatDaneLogo3.0_wTagline_WEB.png" align="right" width="300" />

Great DANE is a suite of tools designed to enable users to send secure, private emails without having to explicitly exchange public keys. By default, email is sent in the clear (without encryption) and unsigned (unauthenticated). S/MIME solves both of these problems by encrypting and signing emails, however it requires you to have the certificate belonging to your correspondent, presenting a chicken-and-egg problem. By using the DNS as a secure distributed database for S/MIME certificates, we can eliminate this barrier and finally make email completely confidential and authenticated.

For more information on DANE SMIMEA, please see the [IETF RFC](https://tools.ietf.org/html/rfc8162).

## Great DANE for Thunderbird

The Great DANE Thunderbird extension integrates the [Great DANE Engine](https://github.com/grierforensics/Great-DANE-Engine) with Mozilla Thunderbird.

**NOTE**: Access to a running Great DANE Engine is required to use Great DANE for Thunderbird. See the [Great DANE Engine Github page](https://github.com/grierforensics/Great-DANE-Engine) for more information.

Once configured to communicate with a running Great DANE Engine, the extension will automatically retrieve S/MIME certificates for senders of incoming mail and recipients of outgoing messages.

If S/MIME encryption is enabled in Thunderbird and DANE SMIMEA records exist for all recipients of an outgoing message, certificate retrieval and storage and message encryption will occur automatically and transparently.

## Installing

The easiest way to install Great DANE for Thunderbird is through the Add-ons Manager in Thunderbird. Open *Add-ons* in Thunderbird and search for "Great DANE".

It is also available for download here: [Great DANE for Thunderbird](https://addons.mozilla.org/en-US/thunderbird/addon/great-dane-smime/).

You can optionally package the Add-on yourself and copy it to to your Thunderbird Profile's `extensions/` directory. Simply run `package.sh`, then copy `greatdane.xpi` to one of the following locations:

- Windows: `%APPDATA%\Thunderbird\Profiles\<Profile Name>\extensions\`
- Linux: `~/.thunderbird/<Profile Name>/extensions/`
- OS X: `~/Library/Thunderbird/Profiles/<Profile Name>/extensions/`

Configure the Great DANE Engine address by navigating to Add-ons -> Great DANE -> Options.

## License

Dual-licensed under Apache License 2.0 and 3-Clause BSD License. See LICENSE.
