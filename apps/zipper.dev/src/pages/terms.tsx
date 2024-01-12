import {
  Box,
  Container,
  Heading,
  Link,
  ListItem,
  OrderedList,
  Text,
} from '@chakra-ui/react';
import { Website } from '@zipper/ui';
import NextLink from 'next/link';

const TermsPage = () => (
  <>
    <Website.Navbar links={{ component: NextLink }} />
    <Box
      display="flex"
      flexDir="column"
      alignItems="start"
      as="main"
      w="full"
      py={8}
      mb={4}
      margin="0 auto"
    >
      <Container maxW="container.xl">
        <Heading
          as="h1"
          fontFamily="plaak"
          fontWeight="900"
          fontSize={{ base: '5xl', lg: '6xl' }}
        >
          TERMS AND CONDITIONS
        </Heading>

        <Heading py={5} as="h3" fontSize="2xl">
          Effective as of September 18, 2023
        </Heading>

        <Text pb={5}>
          Welcome to Zipper. Please read on to learn the rules and restrictions
          that govern your use of our website(s), products, services and
          applications (the “Services”). If you have any questions, comments, or
          concerns regarding these terms or the Services, please contact us at{' '}
          <Link href="mailto: support@zipper.works" color="purple.500">
            support@zipper.works.
          </Link>
          <br />
          <br />
          These Terms of Use (the “Terms”) are a binding contract between you
          and <strong>ZIPPER, INC.</strong> (“Zipper,” “we” and “us”). Your use
          of the Services in any way means that you agree to all of these Terms,
          and these Terms will remain in effect while you use the Services.
          These Terms include the provisions in this document as well as those
          in the{' '}
          <Link as={NextLink} color="purple.500" href="/privacy">
            Privacy Policy
          </Link>
          , Copyright Dispute Policy.{' '}
          <strong>
            Your use of or participation in certain Services may also be subject
            to additional policies, rules and/or conditions (“Additional
            Terms”), which are incorporated herein by reference, and you
            understand and agree that by using or participating in any such
            Services, you agree to also comply with these Additional Terms.
          </strong>
          <br />
          <br />
          Please read these Terms carefully. They cover important information
          about Services provided to you and any charges, taxes, and fees we
          bill you. These Terms include information about future changes to
          these Terms, automatic renewals, limitations of liability, a class
          action waiver and resolution of disputes by arbitration instead of in
          court.{' '}
          <strong>
            LEASE NOTE THAT YOUR USE OF AND ACCESS TO OUR SERVICES ARE SUBJECT
            TO THE FOLLOWING TERMS; IF YOU DO NOT AGREE TO ALL OF THE FOLLOWING,
            YOU MAY NOT USE OR ACCESS THE SERVICES IN ANY MANNER.
          </strong>
          <br />
          <br />
          <strong>ARBITRATION NOTICE AND CLASS ACTION WAIVER:</strong> EXCEPT
          FOR CERTAIN TYPES OF DISPUTES DESCRIBED IN THE ARBITRATION AGREEMENT
          SECTION BELOW, YOU AGREE THAT DISPUTES BETWEEN YOU AND US WILL BE
          RESOLVED BY BINDING, INDIVIDUAL ARBITRATION AND YOU WAIVE YOUR RIGHT
          TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.
        </Text>

        <Heading as="h2" py={5} fontSize="2xl">
          Will these Terms ever change?
        </Heading>

        <Text mb={10}>
          We are constantly trying to improve our Services, so these Terms may
          need to change along with our Services. We reserve the right to change
          the Terms at any time, but if we do, we will place a notice on our
          site located at{' '}
          <Link color="purple.500" href="https://zipper.works" target="_blank">
            https://zipper.works
          </Link>
          , send you an email, and/or notify you by some other means.
          <br />
          <br />
          If you don’t agree with the new Terms, you are free to reject them;
          unfortunately, that means you will no longer be able to use the
          Services. If you use the Services in any way after a change to the
          Terms is effective, that means you agree to all of the changes. <br />{' '}
          <br />
          Except for changes by us as described here, no other amendment or
          modification of these Terms will be effective unless in writing and
          signed by both you and us.
        </Text>

        <Heading as="h2" fontSize="2xl" py={5}>
          What about my privacy?
        </Heading>
        <Text mb={10}>
          Zipper takes the privacy of its users very seriously.
          <br />
          <br />
          You agree, represent, and warrant to Zipper that if you in your use of
          our Services collect any “personal data”, “personally identifiable
          information,” “personal information,” any substantial equivalent of
          these terms, or other data regulated under any applicable laws
          (collectively, “Personal Information”), including Personal Information
          pertaining to a minor, and store such information within your Zipper
          account or upload or otherwise enable such information to be uploaded
          to the application created for you by Zipper, you have obtained valid
          consent for such activities according to the applicable laws of the
          jurisdiction in which the data subject lives. You further agree,
          represent, and warrant to Zipper that you will get and maintain all
          necessary permissions and valid consents required to lawfully transfer
          such personal information to Zipper and to enable such personal
          information to be lawfully collected, processed, and shared by Zipper
          for the purposes of providing the Service or as otherwise directed by
          you.
          <br />
          <br />
          Notwithstanding the foregoing, you acknowledge that the Services
          offered by Zipper are not designed for Personal Information that is
          governed by the General Data Protection Regulation (Regulation (EU)
          2016/679) EU GDPR as it forms part of the law of England and Wales by
          virtue of section 3 of the European Union (Withdrawal) Act 2018 the UK
          Data Protection Laws, the Swiss Federal Act on Data Protection, the UK
          Data Protection Act 2018, or any other Personal Information, including
          sensitive or special data, that might impose specific data security or
          data protection obligations on Zipper, including, without limitation
          (i) “protected health information” as defined under the Health
          Insurance Portability and Accountability Act of 1996 (HIPAA), (ii)
          “cardholder data” as defined under the Payment Card Industry Data
          Security Standard (PCI DSS), or (iii) “nonpublic personal information”
          as defined under the Gramm-Leach-Bliley Act of 1999, in each case as
          such Acts and standards have been or may be supplemented and amended
          from time to time (collectively, “Prohibited Data”). You hereby agree
          and acknowledge that you will not use the Services, nor permit your
          users or anyone you authorize to access the Services, to store,
          transmit, or process Prohibited Data.
          <br />
          <br />
          The foregoing covers all personal information we collect at your
          direction as our customer. However, to learn more about how we at
          Zipper treat any personal information that we collect on our own
          behalf, please click{' '}
          <Link as={NextLink} color="purple.500" href="/privacy">
            here
          </Link>{' '}
          to see the current Zipper Privacy Policy.
        </Text>

        <Heading as="h3" fontSize="lg" py={2}>
          Children’s Online Privacy Protection Act
        </Heading>

        <Text mb={10}>
          The Children’s Online Privacy Protection Act (“COPPA”) requires that
          online service providers obtain parental consent before they knowingly
          collect personally identifiable information online from children who
          are under 13 years of age. We do not knowingly collect or solicit
          personally identifiable information from children under 13 years of
          age; if you are a child under 13 years of age, please do not attempt
          to register for or otherwise use the Services or send us any personal
          information. If we learn we have collected personal information from a
          child under 13 years of age, we will delete that information as
          quickly as possible. If you believe that a child under 13 years of age
          may have provided us personal information, please contact us at{' '}
          <Link href="mailto: support@zipper.works" color="purple.500">
            support@zipper.works
          </Link>
        </Text>

        <Heading as="h3" fontSize="2xl" py={2}>
          What are the basics of using Zipper?
        </Heading>

        <Text mb={10}>
          You may be required to sign up for an account, select a password and
          user name (“Zipper User ID”), and provide us with certain information
          or data, such as your contact information. You promise to provide us
          with accurate, complete, and updated registration information about
          yourself. You may not select as your Zipper User ID a name that you do
          not have the right to use, or another person’s name with the intent to
          impersonate that person. You may not transfer your account to anyone
          else without our prior written permission. <br /> <br />
          Additionally, you may be able to access certain parts or features of
          the Services by using your account credentials from other services
          (each, a “Third Party Account”), such as those offered by Google. By
          using the Services through a Third Party Account, you permit us to
          access certain information from such account for use by the Services.
          You are ultimately in control of how much information is accessible to
          us and may exercise such control by adjusting your privacy settings on
          your Third Party Account. <br /> <br />
          You represent and warrant that you are an individual of legal age to
          form a binding contract (or if not, you’ve received your parent’s or
          guardian’s permission to use the Services and have gotten your parent
          or guardian to agree to these Terms on your behalf). If you’re
          agreeing to these Terms on behalf of an organization or entity, you
          represent and warrant that you are authorized to agree to these Terms
          on that organization’s or entity’s behalf and bind them to these Terms
          (in which case, the references to “you” and “your” in these Terms,
          except for in this sentence, refer to that organization or entity).
          <br /> <br />
          You will only use the Services for your own internal, personal,
          non-commercial use, and not on behalf of or for the benefit of any
          third party, and only in a manner that complies with all laws that
          apply to you. If your use of the Services is prohibited by applicable
          laws, then you aren’t authorized to use the Services. We can’t and
          won’t be responsible for your using the Services in a way that breaks
          the law. <br /> <br />
          You will not share your Zipper User ID, account or password with
          anyone, and you must protect the security of your Zipper User ID,
          account, password and any other access tools or credentials. You’re
          responsible for any activity associated with your Zipper User ID and
          account.
        </Text>

        <Heading as="h3" fontSize="2xl" py={2}>
          What about messaging?
        </Heading>

        <Text mb={10}>
          As part of the Services, you may receive communications through the
          Services, including messages that Zipper sends you (for example, via
          email). When signing up for the Services, you will receive a welcome
          message and instructions on how to stop receiving messages.
        </Text>

        <Heading as="h3" fontSize="2xl" py={2}>
          Are there restrictions in how I can use the Services?
        </Heading>

        <Text mb={5}>
          You represent, warrant, and agree that you will not provide or
          contribute anything, including any Content or User Submission (as
          those terms are defined below), to the Services, or otherwise use or
          interact with the Services, in a manner that:
        </Text>

        <OrderedList fontSize="sm" pl={5} mb={10}>
          {[
            'infringes or violates the intellectual property rights or any other rights of anyone else (including Zipper);',
            'violates any law or regulation, including, without limitation, any applicable export control laws, privacy laws or any other purpose not reasonably intended by Zipper;',
            'is dangerous, harmful, fraudulent, deceptive, threatening, harassing, defamatory, obscene, or otherwise objectionable;',
            'jeopardizes the security of your Zipper User ID, account or anyone else’s (such as allowing someone else to log in to the Services as you);',
            'attempts, in any manner, to obtain the password, account, or other security information from any other user;',
            'violates the security of any computer network, or cracks any passwords or security encryption codes;',
            'runs Maillist, Listserv, any form of auto-responder or “spam” on the Services, or any processes that run or are activated while you are not logged into the Services, or that otherwise interfere with the proper working of the Services (including by placing an unreasonable load on the Services’ infrastructure);',
            '“crawls,” “scrapes,” or “spiders” any page, data, or portion of or relating to the Services or Content (through use of manual or automated means);',
            'copies or stores any significant portion of the Content; or',
            'decompiles, reverse engineers, or otherwise attempts to obtain the source code or underlying ideas or information of or relating to the Services.',
          ].map((item, index) => (
            <ListItem key={item}>{item}</ListItem>
          ))}
        </OrderedList>

        <Text mb={5}>
          A violation of any of the foregoing is grounds for termination of your
          right to use or access the Services.
        </Text>

        <Heading as="h3" fontSize="2xl" py={2}>
          What are my rights in the Services?
        </Heading>

        <Text mb={5}>
          The materials displayed or performed or available on or through the
          Services, including, but not limited to, text, graphics, data,
          articles, photos, images, illustrations, User Submissions (as defined
          below) and so forth (all of the foregoing, the “Content”) are
          protected by copyright and/or other intellectual property laws. You
          promise to abide by all copyright notices, trademark rules,
          information, and restrictions contained in any Content you access
          through the Services, and you won’t use, copy, reproduce, modify,
          translate, publish, broadcast, transmit, distribute, perform, upload,
          display, license, sell, commercialize or otherwise exploit for any
          purpose any Content not owned by you, (i) without the prior consent of
          the owner of that Content or (ii) in a way that violates someone
          else’s (including Zipper’s) rights.
          <br /> <br />
          Subject to these Terms, we grant each user of the Services a
          worldwide, non-exclusive, non-sublicensable and non-transferable
          license to use (i.e., to download and display locally) Content solely
          for purposes of using the Services. Use, reproduction, modification,
          distribution or storage of any Content for any purpose other than
          using the Services is expressly prohibited without prior written
          permission from us. You understand that Zipper owns the Services. You
          won’t modify, publish, transmit, participate in the transfer or sale
          of, reproduce (except as expressly provided in this Section), create
          derivative works based on, or otherwise exploit any of the Services.
          The Services may allow you to copy or download certain Content, but
          please remember that even where these functionalities exist, all the
          restrictions in this section still apply.
        </Text>

        <Heading as="h3" fontSize="2xl" py={2}>
          What about anything I contribute to the Services – do I have to grant
          any licenses to Zipper or to other users?
        </Heading>

        <Heading as="h3" fontSize="lg" py={1}>
          User Submissions
        </Heading>
        <Text mb={5}>
          Anything you post, upload, share, store, or otherwise provide through
          the Services is your “User Submission”. Some User Submissions may be
          viewable by other users. You are solely responsible for all User
          Submissions you contribute to the Services. You represent that all
          User Submissions submitted by you are accurate, complete, up-to-date,
          and in compliance with all applicable laws, rules and regulations.
          <br />
          <br />
          You agree that you will not post, upload, share, store, or otherwise
          provide through the Services any User Submissions that: (i) infringe
          any third party’s copyrights or other rights (e.g., trademark, privacy
          rights, etc.); (ii) contain sexually explicit content or pornography;
          (iii) contain hateful, defamatory, or discriminatory content or incite
          hatred against any individual or group; (iv) exploit minors; (v)
          depict unlawful acts or extreme violence; (vi) depict animal cruelty
          or extreme violence towards animals; (vii) promote fraudulent schemes,
          multi-level marketing (MLM) schemes, get rich quick schemes, online
          gaming and gambling, cash gifting, work from home businesses, or any
          other dubious money-making ventures; or (viii) that violate any law.
        </Text>

        <Heading as="h3" fontSize="lg" py={1}>
          Licenses
        </Heading>
        <Text mb={5}>
          In order to display your User Submissions on the Services, and to
          allow other users to enjoy them (where applicable), you grant us
          certain rights in those User Submissions (see below for more
          information). Please note that all of the following licenses are
          subject to our{' '}
          <Link as={NextLink} color="purple.500" href="/privacy">
            Privacy Policy
          </Link>{' '}
          to the extent they relate to User Submissions that are also your
          personally-identifiable information.
          <br /> <br />
          By submitting User Submissions through the Services, you hereby do and
          shall grant Zipper a worldwide, non-exclusive, perpetual,
          royalty-free, fully paid, sublicensable and transferable license to
          use, edit, modify, truncate, aggregate, reproduce, distribute, prepare
          derivative works of, display, perform, and otherwise fully exploit the
          User Submissions in connection with this site, the Services and our
          (and our successors’ and assigns’) businesses, including without
          limitation for promoting and redistributing part or all of this site
          or the Services (and derivative works thereof) in any media formats
          and through any media channels (including, without limitation, third
          party websites and feeds), and including after your termination of
          your account or the Services. You also hereby do and shall grant each
          user of this site and/or the Services a non-exclusive, perpetual
          license to access your User Submissions through this site and/or the
          Services, and to use, edit, modify, reproduce, distribute, prepare
          derivative works of, display and perform such User Submissions,
          including after your termination of your account or the Services. For
          clarity, the foregoing license grants to us and our users do not
          affect your other ownership or license rights in your User
          Submissions, including the right to grant additional licenses to your
          User Submissions, unless otherwise agreed in writing. You represent
          and warrant that you have all rights to grant such licenses to us
          without infringement or violation of any third party rights, including
          without limitation, any privacy rights, publicity rights, copyrights,
          trademarks, contract rights, or any other intellectual property or
          proprietary rights.
          <br /> <br />
          Finally, you understand and agree that Zipper, in performing the
          required technical steps to provide the Services to our users
          (including you), may need to make changes to your User Submissions to
          conform and adapt those User Submissions to the technical requirements
          of connection networks, devices, services, or media, and the foregoing
          licenses include the rights to do so.
        </Text>

        <Heading as="h3" fontSize="2xl" py={2}>
          What if I see something on the Services that infringes my copyright?
        </Heading>

        <Text mb={5}>
          In accordance with the DMCA, we’ve adopted the following policy toward
          copyright infringement. We reserve the right to (1) block access to or
          remove material that we believe in good faith to be copyrighted
          material that has been illegally copied and distributed by any of our
          advertisers, affiliates, content providers, members or users and (2)
          remove and discontinue service to repeat offenders.
        </Text>

        <OrderedList fontSize="sm" pl={5} mb={10}>
          {[
            'Procedure for Reporting Copyright Infringements. If you believe that material or content residing on or accessible through the Services infringes your copyright (or the copyright of someone whom you are authorized to act on behalf of), please send a notice of copyright infringement containing the following information to Zipper’s Designated Agent to Receive Notification of Claimed Infringement (our “Designated Agent,” whose contact details are listed below):',
            'A physical or electronic signature of a person authorized to act on behalf of the owner of the copyright that has been allegedly infringed;',
            'Identification of works or materials being infringed;',
            'Identification of the material that is claimed to be infringing including information regarding the location of the infringing materials that the copyright owner seeks to have removed, with sufficient detail so that Company is capable of finding and verifying its existence;',
            'Contact information about the notifier including address, telephone number and, if available, email address;',
            'A statement that the notifier has a good faith belief that the material identified in (1)(c) is not authorized by the copyright owner, its agent, or the law; and',
            'A statement made under penalty of perjury that the information provided is accurate and the notifying party is authorized to make the complaint on behalf of the copyright owner.',
            'Once Proper Bona Fide Infringement Notification is Received by the Designated Agent. Upon receipt of a proper notice of copyright infringement, we reserve the right to:',
            'remove or disable access to the infringing material;',
            'notify the content provider who is accused of infringement that we have removed or disabled access to the applicable material; and',
            'terminate such content provider’s access to the Services if he or she is a repeat offender.',
            'Procedure to Supply a Counter-Notice to the Designated Agent. If the content provider believes that the material that was removed (or to which access was disabled) is not infringing, or the content provider believes that it has the right to post and use such material from the copyright owner, the copyright owner’s agent, or, pursuant to the law, the content provider may send us a counter-notice containing the following information to the Designated Agent:',
            'A physical or electronic signature of the content provider;',
            'Identification of the material that has been removed or to which access has been disabled and the location at which the material appeared before it was removed or disabled;',
            'A statement that the content provider has a good faith belief that the material was removed or disabled as a result of mistake or misidentification of the material; and',
            'Content provider’s name, address, telephone number, and, if available, email address, and a statement that such person or entity consents to the jurisdiction of the Federal Court for the judicial district in which the content provider’s address is located, or, if the content provider’s address is located outside the United States, for any judicial district in which Company is located, and that such person or entity will accept service of process from the person who provided notification of the alleged infringement.',
          ].map((item) => (
            <ListItem key={item}>{item}</ListItem>
          ))}
        </OrderedList>

        <Text mb={5}>
          If a counter-notice is received by the Designated Agent, Company may,
          in its discretion, send a copy of the counter-notice to the original
          complaining party informing that person that Company may replace the
          removed material or cease disabling it in 10 business days. Unless the
          copyright owner files an action seeking a court order against the
          content provider accused of committing infringement, the removed
          material may be replaced or access to it restored in 10 to 14 business
          days or more after receipt of the counter-notice, at Company’s
          discretion.
          <br />
          <br />
          Please contact Zipper’s Designated Agent at the following address:
        </Text>

        <Text
          mb={10}
          whiteSpace="pre-line"
          pl={4}
          borderLeft="4px"
          borderColor="purple.100"
        >
          {`Zipper, Inc.
Attn: DMCA Designated Agent
7 Mount Lassen Dr, Unit 152, San Rafael, CA, 94903`}
        </Text>

        <Heading as="h3" fontSize="2xl" py={2}>
          Who is responsible for what I see and do on the Services?
        </Heading>

        <Text mb={10}>
          Any information or Content publicly posted or privately transmitted
          through the Services is the sole responsibility of the person from
          whom such Content originated, and you access all such information and
          Content at your own risk, and we aren’t liable for any errors or
          omissions in that information or Content or for any damages or loss
          you might suffer in connection with it. We cannot control and have no
          duty to take any action regarding how you may interpret and use the
          Content or what actions you may take as a result of having been
          exposed to the Content, and you hereby release us from all liability
          for you having acquired or not acquired Content through the Services.
          We can’t guarantee the identity of any users with whom you interact in
          using the Services and are not responsible for which users gain access
          to the Services.
          <br />
          <br />
          You are responsible for all Content you contribute, in any manner, to
          the Services, and you represent and warrant you have all rights
          necessary to do so, in the manner in which you contribute it.
          <br /> <br />
          The Services may contain links or connections to third-party websites
          or services that are not owned or controlled by Zipper. When you
          access third-party websites or use third-party services, you accept
          that there are risks in doing so, and that Zipper is not responsible
          for such risks.
          <br /> <br />
          Zipper has no control over, and assumes no responsibility for, the
          content, accuracy, privacy policies, or practices of or opinions
          expressed in any third-party websites or by any third party that you
          interact with through the Services. In addition, Zipper will not and
          cannot monitor, verify, censor or edit the content of any third-party
          site or service. We encourage you to be aware when you leave the
          Services and to read the terms and conditions and privacy policy of
          each third-party website or service that you visit or utilize. By
          using the Services, you release and hold us harmless from any and all
          liability arising from your use of any third-party website or service.
          <br /> <br />
          Your interactions with organizations and/or individuals found on or
          through the Services, including payment and delivery of goods or
          services, and any other terms, conditions, warranties or
          representations associated with such dealings, are solely between you
          and such organizations and/or individuals. You should make whatever
          investigation you feel necessary or appropriate before proceeding with
          any online or offline transaction with any of these third parties. You
          agree that Zipper shall not be responsible or liable for any loss or
          damage of any sort incurred as the result of any such dealings.
          <br /> <br />
          If there is a dispute between participants on this site or Services,
          or between users and any third party, you agree that Zipper is under
          no obligation to become involved. In the event that you have a dispute
          with one or more other users, you release Zipper, its directors,
          officers, employees, agents, and successors from claims, demands, and
          damages of every kind or nature, known or unknown, suspected or
          unsuspected, disclosed or undisclosed, arising out of or in any way
          related to such disputes and/or our Services. You shall and hereby do
          waive California Civil Code Section 1542 or any similar law of any
          jurisdiction, which says in substance: “A general release does not
          extend to claims that the creditor or releasing party does not know or
          suspect to exist in his or her favor at the time of executing the
          release and that, if known by him or her, would have materially
          affected his or her settlement with the debtor or released party.”
        </Text>

        <Heading as="h3" fontSize="2xl" py={2}>
          Will Zipper ever change the Services?
        </Heading>

        <Text mb={10}>
          We’re always trying to improve our Services, so they may change over
          time. We may suspend or discontinue any part of the Services, or we
          may introduce new features or impose limits on certain features or
          restrict access to parts or all of the Services. We’ll try to give you
          notice when we make a material change to the Services that would
          adversely affect you, but this isn’t always practical. We reserve the
          right to remove any Content from the Services at any time, for any
          reason (including, but not limited to, if someone alleges you
          contributed that Content in violation of these Terms), in our sole
          discretion, and without notice.
        </Text>

        <Heading as="h3" fontSize="2xl" py={2}>
          Do the Services cost anything?
        </Heading>

        <Text mb={5}>
          The Services may be free or we may charge a fee for using the
          Services. If you are using a free version of the Services, we will
          notify you before any Services you are then using begin carrying a
          fee, and if you wish to continue using such Services, you must pay all
          applicable fees for such Services. Note that if you elect to receive
          text messages through the Services, data and message rates may apply.
          Any and all such charges, fees or costs are your sole responsibility.
          You should consult with your wireless carrier to determine what rates,
          charges, fees or costs may apply to your use of the Services.
        </Text>

        <OrderedList fontSize="sm" pl={5} mb={10}>
          {[
            <Text>
              Paid Services. Certain of our Services may be subject to payments
              now or in the future (the “Paid Services”). Please see our{' '}
              <Link href="#" color="purple.500">
                Paid Services
              </Link>{' '}
              page for a description of the current Paid Services. Please note
              that any payment terms presented to you in the process of using or
              signing up for a Paid Service are deemed part of these Terms.
            </Text>,
            <Text>
              Billing. We use a third-party payment processor (the “Payment
              Processor”) to bill you through a payment account linked to your
              account on the Services (your “Billing Account”) for use of the
              Paid Services. The processing of payments will be subject to the
              terms, conditions and privacy policies of the Payment Processor in
              addition to these Terms. Currently, we use Stripe, Inc. as our
              Payment Processor. You can access Stripe’s Terms of Service at{' '}
              <Link
                href="https://stripe.com/us/checkout/legal"
                target="_blank"
                color="purple.500"
              >
                https://stripe.com/us/checkout/legal
              </Link>{' '}
              and their Privacy Policy at{' '}
              <Link
                href="https://stripe.com/us/privacy"
                target="_blank"
                color="purple.500"
              >
                https://stripe.com/us/privacy
              </Link>
              . We are not responsible for any error by, or other acts or
              omissions of, the Payment Processor. By choosing to use Paid
              Services, you agree to pay us, through the Payment Processor, all
              charges at the prices then in effect for any use of such Paid
              Services in accordance with the applicable payment terms, and you
              authorize us, through the Payment Processor, to charge your chosen
              payment provider (your “Payment Method”). You agree to make
              payment using that selected Payment Method. We reserve the right
              to correct any errors or mistakes that the Payment Processor makes
              even if it has already requested or received payment.
            </Text>,
            <Text>
              Payment Method. The terms of your payment will be based on your
              Payment Method and may be determined by agreements between you and
              the financial institution, credit card issuer or other provider of
              your chosen Payment Method. If we, through the Payment Processor,
              do not receive payment from you, you agree to pay all amounts due
              on your Billing Account upon demand.
            </Text>,
            <Text>
              Recurring Billing. Some of the Paid Services may consist of an
              initial period, for which there is a one-time charge, followed by
              recurring period charges as agreed to by you. By choosing a
              recurring payment plan, you acknowledge that such Services have an
              initial and recurring payment feature and you accept
              responsibility for all recurring charges prior to cancellation. WE
              MAY SUBMIT PERIODIC CHARGES (E.G., MONTHLY) WITHOUT FURTHER
              AUTHORIZATION FROM YOU, UNTIL YOU PROVIDE PRIOR NOTICE (RECEIPT OF
              WHICH IS CONFIRMED BY US) THAT YOU HAVE TERMINATED THIS
              AUTHORIZATION OR WISH TO CHANGE YOUR PAYMENT METHOD. SUCH NOTICE
              WILL NOT AFFECT CHARGES SUBMITTED BEFORE WE REASONABLY COULD ACT.
              TO TERMINATE YOUR AUTHORIZATION OR CHANGE YOUR PAYMENT METHOD,
              PLEASE EMAIL{' '}
              <Link href="mailto: support@zipper.works" color="purple.500">
                support@zipper.works
              </Link>
              .
            </Text>,
            <Text>
              Change in Amount Authorized. If the amount to be charged to your
              Billing Account varies from the amount you preauthorized (other
              than due to the imposition or change in the amount of state sales
              taxes), you have the right to receive, and we shall provide,
              notice of the amount to be charged and the date of the charge
              before the scheduled date of the transaction. Any agreement you
              have with your payment provider will govern your use of your
              Payment Method. You agree that we may accumulate charges incurred
              and submit them as one or more aggregate charges during or at the
              end of each billing cycle.
            </Text>,
            <Text>
              Auto-Renewal for Paid Services. Unless you opt out of
              auto-renewal, which can be done by emailing us at{' '}
              <Link href="mailto: support@zipper.works" color="purple.500">
                support@zipper.works
              </Link>
              , any Paid Services you have signed up for will be automatically
              extended for successive renewal periods of the same duration as
              the subscription term originally selected, at the then-current
              non-promotional rate. To change or resign your Paid Services at
              any time, email us at{' '}
              <Link href="mailto: support@zipper.works" color="purple.500">
                support@zipper.works
              </Link>
              . If you terminate a Paid Service, you may use your subscription
              until the end of your then-current term, and your subscription
              will not be renewed after your then-current term expires. However,
              you will not be eligible for a prorated refund of any portion of
              the subscription fee paid for the then-current subscription
              period. If you do not want to continue to be charged on a
              recurring monthly basis, you must cancel the applicable Paid
              Service BY EMAILING US{' '}
              <Link href="mailto: support@zipper.works" color="purple.500">
                support@zipper.works
              </Link>{' '}
              or terminate your ZIPPER account before the end of the recurring
              TERM. Paid Services cannot be terminated before the end of the
              period for which you have already paid, and except as expressly
              provided in these terms, ZIPPER will not refund any fees that you
              have already paid.
            </Text>,
            <Text>
              Reaffirmation of Authorization. Your non-termination or continued
              use of a Paid Service reaffirms that we are authorized to charge
              your Payment Method for that Paid Service. We may submit those
              charges for payment and you will be responsible for such charges.
              This does not waive our right to seek payment directly from you.
              Your charges may be payable in advance, in arrears, per usage, or
              as otherwise described when you initially selected to use the Paid
              Service.
            </Text>,
          ].map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <ListItem key={index}>{item}</ListItem>
          ))}
        </OrderedList>

        <Heading as="h3" fontSize="2xl" py={2}>
          What if I want to stop using the Services?
        </Heading>

        <Text mb={10}>
          You’re free to do that at any time by contacting us at{' '}
          <Link href="mailto: support@zipper.works" color="purple.500">
            support@zipper.works
          </Link>
          ; please refer to our{' '}
          <Link as={NextLink} color="purple.500" href="/privacy">
            Privacy Policy
          </Link>
          , as well as the licenses above, to understand how we treat
          information you provide to us after you have stopped using our
          Services. Zipper is also free to terminate (or suspend access to) your
          use of the Services or your account for any reason in our discretion,
          including your breach of these Terms. Zipper has the sole right to
          decide whether you are in violation of any of the restrictions set
          forth in these Terms. Account termination may result in destruction of
          any Content associated with your account, so keep that in mind before
          you decide to terminate your account. If you have deleted your account
          by mistake, contact us immediately at{' '}
          <Link href="mailto: support@zipper.works" color="purple.500">
            support@zipper.works
          </Link>{' '}
          - we will try to help, but unfortunately, we can’t promise that we can
          recover or restore anything. Provisions that, by their nature, should
          survive termination of these Terms shall survive termination. By way
          of example, all of the following will survive termination: any
          obligation you have to pay us or indemnify us, any limitations on our
          liability, any terms regarding ownership or intellectual property
          rights, and terms regarding disputes between us, including without
          limitation the arbitration agreement.
        </Text>

        <Heading as="h3" fontSize="2xl" py={2}>
          What else do I need to know?
        </Heading>

        <Text mb={10}>
          Warranty Disclaimer. Zipper and its licensors, suppliers, partners,
          parent, subsidiaries or affiliated entities, and each of their
          respective officers, directors, members, employees, consultants,
          contract employees, representatives and agents, and each of their
          respective successors and assigns (Zipper and all such parties
          together, the “Zipper Parties”) make no representations or warranties
          concerning the Services, including without limitation regarding any
          Content contained in or accessed through the Services, and the Zipper
          Parties will not be responsible or liable for the accuracy, copyright
          compliance, legality, or decency of material contained in or accessed
          through the Services or any claims, actions, suits procedures, costs,
          expenses, damages or liabilities arising out of use of, or in any way
          related to your participation in, the Services. The Zipper Parties
          make no representations or warranties regarding suggestions or
          recommendations of services or products offered or purchased through
          or in connection with the Services. THE SERVICES AND CONTENT ARE
          PROVIDED BY ZIPPER (AND ITS LICENSORS AND SUPPLIERS) ON AN “AS-IS”
          BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
          INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR THAT USE OF THE
          SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE. SOME STATES DO NOT ALLOW
          LIMITATIONS ON HOW LONG AN IMPLIED WARRANTY LASTS, SO THE ABOVE
          LIMITATIONS MAY NOT APPLY TO YOU.
          <br /> <br />
          Limitation of Liability. TO THE FULLEST EXTENT ALLOWED BY APPLICABLE
          LAW, UNDER NO CIRCUMSTANCES AND UNDER NO LEGAL THEORY (INCLUDING,
          WITHOUT LIMITATION, TORT, CONTRACT, STRICT LIABILITY, OR OTHERWISE)
          SHALL ANY OF THE ZIPPER PARTIES BE LIABLE TO YOU OR TO ANY OTHER
          PERSON FOR (A) ANY INDIRECT, SPECIAL, INCIDENTAL, PUNITIVE OR
          CONSEQUENTIAL DAMAGES OF ANY KIND, INCLUDING DAMAGES FOR LOST PROFITS,
          BUSINESS INTERRUPTION, LOSS OF DATA, LOSS OF GOODWILL, WORK STOPPAGE,
          ACCURACY OF RESULTS, OR COMPUTER FAILURE OR MALFUNCTION, (B) ANY
          SUBSTITUTE GOODS, SERVICES OR TECHNOLOGY, (C) ANY AMOUNT, IN THE
          AGGREGATE, IN EXCESS OF THE GREATER OF (I) ONE-HUNDRED ($100) DOLLARS
          OR (II) THE AMOUNTS PAID AND/OR PAYABLE BY YOU TO ZIPPER IN CONNECTION
          WITH THE SERVICES IN THE TWELVE (12) MONTH PERIOD PRECEDING THIS
          APPLICABLE CLAIM OR (D) ANY MATTER BEYOND OUR REASONABLE CONTROL. SOME
          STATES DO NOT ALLOW THE EXCLUSION OR LIMITATION OF INCIDENTAL OR
          CONSEQUENTIAL OR CERTAIN OTHER DAMAGES, SO THE ABOVE LIMITATION AND
          EXCLUSIONS MAY NOT APPLY TO YOU.
          <br /> <br />
          Indemnity. To the fullest extent allowed by applicable law, you agree
          to indemnify and hold the Zipper Parties harmless from and against any
          and all claims, liabilities, damages (actual and consequential),
          losses and expenses (including attorneys’ fees) arising from or in any
          way related to any claims relating to (a) your use of the Services
          (including any actions taken by a third party using your account), and
          (b) your violation of these Terms. In the event of such a claim, suit,
          or action (“Claim”), we will attempt to provide notice of the Claim to
          the contact information we have for your account (provided that
          failure to deliver such notice shall not eliminate or reduce your
          indemnification obligations hereunder).
          <br /> <br />
          Assignment. You may not assign, delegate or transfer these Terms or
          your rights or obligations hereunder, or your Services account, in any
          way (by operation of law or otherwise) without Zipper’s prior written
          consent. We may transfer, assign, or delegate these Terms and our
          rights and obligations without consent.
          <br /> <br />
          Choice of Law. These Terms are governed by and will be construed under
          the Federal Arbitration Act, applicable federal law, and the laws of
          the State of Delaware, without regard to the conflicts of laws
          provisions thereof.
          <br /> <br />
          Arbitration Agreement. Please read the following ARBITRATION AGREEMENT
          carefully because it requires you to arbitrate certain disputes and
          claims with Zipper and limits the manner in which you can seek relief
          from Zipper. Both you and Zipper acknowledge and agree that for the
          purposes of any dispute arising out of or relating to the subject
          matter of these Terms, Zipper’s officers, directors, employees and
          independent contractors (“Personnel”) are third-party beneficiaries of
          these Terms, and that upon your acceptance of these Terms, Personnel
          will have the right (and will be deemed to have accepted the right) to
          enforce these Terms against you as the third-party beneficiary hereof.
        </Text>

        <OrderedList fontSize="sm" pl={5} mb={10}>
          {[
            <Text>
              <i>Arbitration Rules; Applicability of Arbitration Agreement.</i>{' '}
              The parties shall use their best efforts to settle any dispute,
              claim, question, or disagreement arising out of or relating to the
              subject matter of these Terms directly through good-faith
              negotiations, which shall be a precondition to either party
              initiating arbitration. If such negotiations do not resolve the
              dispute, it shall be finally settled by binding arbitration in San
              Francisco. The arbitration will proceed in the English language,
              in accordance with the JAMS Streamlined Arbitration Rules and
              Procedures (the “Rules”) then in effect, by one commercial
              arbitrator with substantial experience in resolving intellectual
              property and commercial contract disputes. The arbitrator shall be
              selected from the appropriate list of JAMS arbitrators in
              accordance with such Rules. Judgment upon the award rendered by
              such arbitrator may be entered in any court of competent
              jurisdiction.
            </Text>,
            <Text>
              <i>Costs of Arbitration.</i> The Rules will govern payment of all
              arbitration fees. Zipper will pay all arbitration fees for claims
              less than seventy-five thousand ($75,000) dollars. Zipper will not
              seek its attorneys’ fees and costs in arbitration unless the
              arbitrator determines that your claim is frivolous.
            </Text>,
            <Text>
              <i>Small Claims Court; Infringement.</i> Either you or Zipper may
              assert claims, if they qualify, in small claims court in San
              Francisco, California or any United States county where you live
              or work. Furthermore, notwithstanding the foregoing obligation to
              arbitrate disputes, each party shall have the right to pursue
              injunctive or other equitable relief at any time, from any court
              of competent jurisdiction, to prevent the actual or threatened
              infringement, misappropriation or violation of a party’s
              copyrights, trademarks, trade secrets, patents or other
              intellectual property rights.
            </Text>,
            <Text>
              <i>Waiver of Jury Trial.</i> YOU AND ZIPPER WAIVE ANY
              CONSTITUTIONAL AND STATUTORY RIGHTS TO GO TO COURT AND HAVE A
              TRIAL IN FRONT OF A JUDGE OR JURY. You and Zipper are instead
              choosing to have claims and disputes resolved by arbitration.
              Arbitration procedures are typically more limited, more efficient,
              and less costly than rules applicable in court and are subject to
              very limited review by a court. In any litigation between you and
              Zipper over whether to vacate or enforce an arbitration award, YOU
              AND ZIPPER WAIVE ALL RIGHTS TO A JURY TRIAL, and elect instead to
              have the dispute be resolved by a judge.
            </Text>,
            <Text>
              <i>Waiver of Class or Consolidated Actions.</i> ALL CLAIMS AND
              DISPUTES WITHIN THE SCOPE OF THIS ARBITRATION AGREEMENT MUST BE
              ARBITRATED OR LITIGATED ON AN INDIVIDUAL BASIS AND NOT ON A CLASS
              BASIS. CLAIMS OF MORE THAN ONE CUSTOMER OR USER CANNOT BE
              ARBITRATED OR LITIGATED JOINTLY OR CONSOLIDATED WITH THOSE OF ANY
              OTHER CUSTOMER OR USER. If however, this waiver of class or
              consolidated actions is deemed invalid or unenforceable, neither
              you nor Zipper is entitled to arbitration; instead all claims and
              disputes will be resolved in a court as set forth in (g) below.
            </Text>,
            <Text>
              <i>Opt-out.</i> You have the right to opt out of the provisions of
              this Section by sending written notice of your decision to opt out
              to the following address: 1700 Montgomery Street, Suite 108, San
              Francisco, CA, 94111 postmarked within thirty (30) days of first
              accepting these Terms. You must include (i) your name and
              residence address, (ii) the email address and/or telephone number
              associated with your account, and (iii) a clear statement that you
              want to opt out of these Terms’ arbitration agreement.
            </Text>,
            <Text>
              <i>Exclusive Venue.</i> If you send the opt-out notice in (f),
              and/or in any circumstances where the foregoing arbitration
              agreement permits either you or Zipper to litigate any dispute
              arising out of or relating to the subject matter of these Terms in
              court, then the foregoing arbitration agreement will not apply to
              either party, and both you and Zipper agree that any judicial
              proceeding (other than small claims actions) will be brought in
              the state or federal courts located in, respectively, San
              Francisco County, or the federal district in which that county
              falls.
            </Text>,
            <Text>
              <i>Severability.</i> If the prohibition against class actions and
              other claims brought on behalf of third parties contained above is
              found to be unenforceable, then all of the preceding language in
              this Arbitration Agreement section will be null and void. This
              arbitration agreement will survive the termination of your
              relationship with Zipper.
            </Text>,
          ].map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <ListItem key={index}>{item}</ListItem>
          ))}
        </OrderedList>

        <Text mb={10}>
          Miscellaneous. You will be responsible for paying, withholding,
          filing, and reporting all taxes, duties, and other governmental
          assessments associated with your activity in connection with the
          Services, provided that the Zipper may, in its sole discretion, do any
          of the foregoing on your behalf or for itself as it sees fit. The
          failure of either you or us to exercise, in any way, any right herein
          shall not be deemed a waiver of any further rights hereunder. If any
          provision of these Terms are found to be unenforceable or invalid,
          that provision will be limited or eliminated, to the minimum extent
          necessary, so that these Terms shall otherwise remain in full force
          and effect and enforceable. You and Zipper agree that these Terms are
          the complete and exclusive statement of the mutual understanding
          between you and Zipper, and that these Terms supersede and cancel all
          previous written and oral agreements, communications and other
          understandings relating to the subject matter of these Terms. You
          hereby acknowledge and agree that you are not an employee, agent,
          partner, or joint venture of Zipper, and you do not have any authority
          of any kind to bind Zipper in any respect whatsoever.
          <br />
          <br />
          Except as expressly set forth in the section above regarding the
          arbitration agreement, you and Zipper agree there are no third-party
          beneficiaries intended under these Terms.
        </Text>
      </Container>
    </Box>
    <Website.Footer hideAppletDemo links={{ component: NextLink }} />
  </>
);

TermsPage.skipAuth = true;

export default TermsPage;
