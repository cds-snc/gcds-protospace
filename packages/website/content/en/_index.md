---
title: "GCDS Protospace"
description: "Welcome to the GCDS Protospace!"
---
This is a sample content page for the Hugo site.

## Button Examples

Default button:
{{< gcds-button >}}Click me{{< /gcds-button >}}

Primary button with link:
{{< gcds-button button-type="primary" href="/some-page" >}}Learn more{{< /gcds-button >}}

Secondary button:
{{< gcds-button button-type="secondary" size="small" >}}Cancel{{< /gcds-button >}}

## Alert Examples

Info alert:
{{< gcds-alert type="info" heading="Information" >}}
This is an informational message.
{{< /gcds-alert >}}

Success alert with dismiss button:
{{< gcds-alert type="success" heading="Success!" dismiss=true >}}
Your changes have been saved successfully.
{{< /gcds-alert >}}

Warning alert:
{{< gcds-alert type="warning" heading="Warning" >}}
Please review your information before proceeding.
{{< /gcds-alert >}}
