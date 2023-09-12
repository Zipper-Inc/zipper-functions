import {
  Box,
  Container,
  Heading,
  Link,
  ListItem,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  UnorderedList,
} from '@chakra-ui/react';
import { Website } from '@zipper/ui';
import NextLink from 'next/link';
import { NextPageWithLayout } from './_app';

const PrivacyPage: NextPageWithLayout = () => {
  return (
    <>
      <Website.Navbar links={{ component: NextLink }} />
      <Box
        display="flex"
        flexDir="column"
        alignItems="start"
        as="main"
        w="full"
        bg="white"
        py={8}
        margin="0 auto"
      >
        <Container maxW="container.xl">
          <Heading
            as="h1"
            fontFamily="plaak"
            mb={4}
            fontWeight="900"
            fontSize={{ base: '5xl', lg: '6xl' }}
          >
            PRIVACY POLICY
          </Heading>

          <Heading py={5} as="h3" fontSize="2xl">
            Effective as of July 9, 2021
          </Heading>

          <Text pb={5}>
            At Zipper, we take your privacy seriously. Please read this Privacy
            Policy to learn how we treat your personal data.{' '}
            <strong>
              By using or accessing our Services in any manner, you acknowledge
              that you accept the practices and policies outlined below, and you
              hereby consent that we will collect, use and share your
              information as described in this Privacy Policy.
            </strong>
            <br /> <br />
            Remember that your use of Zipper’s Services is at all times subject
            to our Terms of Use, which incorporates this Privacy Policy. Any
            terms we use in this Policy without defining them have the
            definitions given to them in the{' '}
            <Link as={NextLink} color="purple.500" href="/terms">
              Terms of Use
            </Link>
            .
            <br /> <br />
            You may print a copy of this Privacy Policy by clicking here. If you
            have a disability, you may access this Privacy Policy in an
            alternative format by contacting{' '}
            <Link color="purple.500" href="mailto:">
              support@zipper.works
            </Link>{' '}
            .
          </Text>

          <Heading py={5} fontWeight="extrabold" as="h1" fontSize="4xl">
            Table of contents
          </Heading>

          <UnorderedList css={{ listStyle: 'none' }} pb={4} ml={-1}>
            <ListItem fontWeight="bold">
              What this Privacy Policy Covers
            </ListItem>
            <ListItem>
              <Text fontWeight="bold">Personal Data</Text>
              <UnorderedList pl={10} py={2} fontSize="sm">
                <ListItem>Categories of Personal Data We Collect</ListItem>
                <ListItem>Categories of Sources of Personal Data</ListItem>
                <ListItem>
                  Our Commercial or Business Purposes for Collecting Personal
                  Data
                </ListItem>
              </UnorderedList>
            </ListItem>
            <ListItem fontWeight="bold">
              How We Share Your Personal Data
            </ListItem>
            <ListItem fontWeight="bold">Tracking Tools and Opt-Out</ListItem>
            <ListItem fontWeight="bold">Data Security and Retention</ListItem>
            <ListItem fontWeight="bold">California Resident Rights</ListItem>
            <ListItem fontWeight="bold">
              Other State Law Privacy Rights
            </ListItem>
            <ListItem fontWeight="bold">
              Changes to this Privacy Policy
            </ListItem>
            <ListItem fontWeight="bold">Contact Information</ListItem>
          </UnorderedList>

          <Heading py={5} fontWeight="extrabold" as="h1" fontSize="4xl">
            What this Privacy Policy Covers
          </Heading>

          <Text mb={10}>
            This Privacy Policy covers how we treat Personal Data that we gather
            when you access or use our Services. “Personal Data” means any
            information that identifies or relates to a particular individual
            and also includes information referred to as “personally
            identifiable information” or “personal information” under applicable
            data privacy laws, rules or regulations. This Privacy Policy does
            not cover the practices of companies we don’t own or control or
            people we don’t manage.
          </Text>

          <Heading py={5} fontWeight="extrabold" as="h1" fontSize="4xl">
            Personal Data
          </Heading>

          <Heading py={5} as="h3" fontSize="2xl">
            Categories of Personal Data We Collect
          </Heading>

          <Text mb={10}>
            This chart details the categories of Personal Data that we collect
            and have collected over the past 12 months:
          </Text>

          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Category of Personal Data</Th>
                <Th>Examples of Personal Data We Collect</Th>
                <Th>
                  Categories of Third Parties With Whom We Share this Personal
                  Data:
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td fontWeight="bold">Profile or Contact Data</Td>
                <Td>
                  <UnorderedList>
                    <ListItem>First and last name</ListItem>
                    <ListItem>Email</ListItem>
                    <ListItem>Unique identifiers such as passwords</ListItem>
                  </UnorderedList>
                </Td>
                <Td>
                  <UnorderedList>
                    <ListItem>Service Providers</ListItem>
                    <ListItem>
                      Parties You Authorize, Access or Authenticate
                    </ListItem>
                  </UnorderedList>
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Payment Data</Td>
                <Td>
                  <UnorderedList>
                    <ListItem>Payment card type</ListItem>
                    <ListItem>Payment card number</ListItem>
                    <ListItem>
                      Billing address, phone number, and email
                    </ListItem>
                  </UnorderedList>
                </Td>
                <Td>
                  <UnorderedList>
                    <ListItem>
                      Service Providers (specifically our payment processing
                      partner, currently Stripe, Inc.)
                    </ListItem>
                  </UnorderedList>
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Device/IP Data</Td>
                <Td>
                  <UnorderedList>
                    <ListItem>IP address</ListItem>
                    <ListItem>Device ID</ListItem>
                    <ListItem>
                      Type of device/operating system/browser used to access the
                      Services
                    </ListItem>
                  </UnorderedList>
                </Td>
                <Td>
                  <UnorderedList>
                    <ListItem>Service Providers</ListItem>
                    <ListItem>Analytics Partners</ListItem>
                  </UnorderedList>
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Web Analytics</Td>
                <Td>
                  <UnorderedList>
                    <ListItem>
                      Referring webpage/source through which you accessed the
                      Services
                    </ListItem>
                    <ListItem>
                      Statistics associated with the interaction between device
                      or browser and the Services
                    </ListItem>
                  </UnorderedList>
                </Td>
                <Td>
                  <UnorderedList>
                    <ListItem>Service Providers</ListItem>
                    <ListItem>Analytics Partners</ListItem>
                  </UnorderedList>
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Social Network Data</Td>
                <Td>
                  <UnorderedList>
                    <ListItem>Email</ListItem>
                  </UnorderedList>
                </Td>
                <Td>
                  <UnorderedList>
                    <ListItem>Service Providers</ListItem>
                    <ListItem>Analytics Partners</ListItem>
                    <ListItem>
                      Parties You Authorize, Access or Authenticate
                    </ListItem>
                  </UnorderedList>
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">
                  Professional or Employment-Related Data
                </Td>
                <Td>
                  <UnorderedList>
                    <ListItem>Job title</ListItem>
                  </UnorderedList>
                </Td>
                <Td>
                  <UnorderedList>
                    <ListItem>Service Providers </ListItem>
                    <ListItem>Analytics Partners </ListItem>
                    <ListItem>
                      Parties You Authorize, Access or Authenticate
                    </ListItem>
                  </UnorderedList>
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Sensory Data</Td>
                <Td>
                  <UnorderedList>
                    <ListItem>
                      Photos, videos or recordings of your environment
                    </ListItem>
                  </UnorderedList>
                </Td>
                <Td>
                  <UnorderedList>
                    <ListItem>Service Providers </ListItem>
                    <ListItem>Analytics Partners </ListItem>
                    <ListItem>
                      Parties You Authorize, Access or Authenticate
                    </ListItem>
                  </UnorderedList>
                </Td>
              </Tr>
            </Tbody>
          </Table>

          <Heading py={5} as="h3" fontSize="2xl">
            Categories of Sources of Personal Data
          </Heading>

          <Text mb={10}>
            We collect Personal Data about you from the following categories of
            sources:
          </Text>

          <Heading py={2} as="h4" fontSize="lg">
            You
          </Heading>

          <Text as="strong" fontSize="sm">
            When you provide such information directly to us.
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              When you create an account or use our interactive tools and
              Services.
            </ListItem>
            <ListItem>
              When you voluntarily provide information in free-form text boxes
              through the Services or through responses to surveys or
              questionnaires.
            </ListItem>
            <ListItem>
              When you send us an email or otherwise contact us.
            </ListItem>
          </UnorderedList>

          <Text as="strong" fontSize="sm">
            When you use the Services and such information is collected
            automatically.
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              Through Cookies (defined in the “Tracking Tools and Opt-Out”
              section below).
            </ListItem>
            <ListItem>
              If you use a location-enabled browser, we may receive information
              about your location.
            </ListItem>
            <ListItem>
              If you download and install certain applications and software we
              make available, we may receive and collect information transmitted
              from your computing device for the purpose of providing you the
              relevant Services, such as information regarding when you are
              logged on and available to receive updates or alert notices.
            </ListItem>
          </UnorderedList>

          <Heading py={2} as="h4" fontSize="lg">
            Third Parties
          </Heading>

          <Text as="strong" fontSize="sm">
            Customers
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              We may receive your name and email address when our customers ask
              us to share access to the Services with you.
            </ListItem>
          </UnorderedList>

          <Text as="strong" fontSize="sm">
            Vendors
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              We may use analytics providers to analyze how you interact and
              engage with the Services, or third parties may help us provide you
              with customer support.
            </ListItem>
          </UnorderedList>

          <Text as="strong" fontSize="sm">
            Social Networks
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              If you provide your social network account credentials to us or
              otherwise sign in to the Services through a third-party site or
              service, some content and/or information in those accounts may be
              transmitted into your account with us.
            </ListItem>
          </UnorderedList>

          <Heading py={5} as="h3" fontSize="2xl">
            Our Commercial or Business Purposes for Collecting Personal Data
          </Heading>

          <Heading py={2} as="h4" fontSize="lg">
            Providing, Customizing and Improving the Services
          </Heading>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              Creating and managing your account or other user profiles.
            </ListItem>
            <ListItem>
              Processing orders or other transactions; billing.
            </ListItem>
            <ListItem>
              Providing you with the products, services or information you
              request.
            </ListItem>
            <ListItem>
              Meeting or fulfilling the reason you provided the information to
              us.
            </ListItem>
            <ListItem>
              Providing support and assistance for the Services.
            </ListItem>
            <ListItem>
              Improving the Services, including testing, research, internal
              analytics and product development.
            </ListItem>
            <ListItem>
              Personalizing the Services, website content and communications
              based on your preferences.
            </ListItem>
            <ListItem>Doing fraud protection, security and debugging.</ListItem>
            <ListItem>
              Carrying out other business purposes stated when collecting your
              Personal Data or as otherwise set forth in applicable data privacy
              laws, such as the California Consumer Privacy Act (the “CCPA”).
            </ListItem>
          </UnorderedList>

          <Heading py={2} as="h4" fontSize="lg">
            Marketing the Services
          </Heading>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>Marketing and selling the Services.</ListItem>
          </UnorderedList>

          <Heading py={2} as="h4" fontSize="lg">
            Corresponding with You
          </Heading>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              Responding to correspondence that we receive from you, contacting
              you when necessary or requested, and sending you information about
              Zipper or the Services.
            </ListItem>
            <ListItem>
              Sending emails and other communications according to your
              preferences or that display content that we think will interest
              you
            </ListItem>
          </UnorderedList>

          <Heading py={2} as="h4" fontSize="lg">
            Meeting Legal Requirements and Enforcing Legal Terms
          </Heading>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              Fulfilling our legal obligations under applicable law, regulation,
              court order or other legal process, such as preventing, detecting
              and investigating security incidents and potentially illegal or
              prohibited activities.
            </ListItem>
            <ListItem>
              Protecting the rights, property or safety of you, Zipper or
              another party.
            </ListItem>
            <ListItem>Enforcing any agreements with you.</ListItem>
            <ListItem>
              Responding to claims that any posting or other content violates
              third-party rights.
            </ListItem>
            <ListItem>Resolving disputes.</ListItem>
          </UnorderedList>

          <Text mb={10}>
            We will not collect additional categories of Personal Data or use
            the Personal Data we collected for materially different, unrelated
            or incompatible purposes without providing you notice.
          </Text>

          <Heading py={5} fontWeight="extrabold" as="h1" fontSize="4xl">
            How We Share Your Personal Data
          </Heading>

          <Text mb={10}>
            We disclose your Personal Data to the categories of service
            providers and other parties listed in this section. Depending on
            state laws that may be applicable to you, some of these disclosures
            may constitute a “sale” of your Personal Data. For more information,
            please refer to the state-specific sections below.
          </Text>

          <Text>
            <strong>Service Providers</strong>. These parties help us provide
            the Services or perform business functions on our behalf. They
            include:
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              Hosting, technology and communication providers.
            </ListItem>
            <ListItem>Support and customer service vendors.</ListItem>
            <ListItem>
              <strong>Payment processors</strong>. Our payment processing
              partner Stripe, Inc. (“Stripe”) collects your voluntarily-provided
              payment card information necessary to process your payment.
            </ListItem>
            <ListItem>
              Please see Stripe’s terms of service and privacy policy for
              information on its use and storage of your Personal Data.
            </ListItem>
          </UnorderedList>

          <Text>
            <strong>Analytics Partners</strong>. These parties provide analytics
            on web traffic or usage of the Services. They include:
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              Companies that track how users found or were referred to the
              Services.
            </ListItem>
            <ListItem>
              Companies that track how users interact with the Services.
            </ListItem>
          </UnorderedList>

          <Text>
            <strong>Business Partners</strong>. These parties partner with us in
            offering various services. They include:
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              Companies that we partner with to offer certain functionalities in
              the Services.
            </ListItem>
          </UnorderedList>

          <Text>
            <strong>Parties You Authorize, Access or Authenticate.</strong>
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>Third parties you access through the services.</ListItem>
            <ListItem>Social media services.</ListItem>
            <ListItem>Other users.</ListItem>
          </UnorderedList>

          <Heading py={5} as="h3" fontSize="2xl">
            Legal Obligations
          </Heading>

          <Text mb={10}>
            We may share any Personal Data that we collect with third parties in
            conjunction with any of the activities set forth under “Meeting
            Legal Requirements and Enforcing Legal Terms” in the “Our Commercial
            or Business Purposes for Collecting Personal Data” section above.
          </Text>

          <Heading py={5} as="h3" fontSize="2xl">
            Business Transfers
          </Heading>

          <Text mb={10}>
            All of your Personal Data that we collect may be transferred to a
            third party if we undergo a merger, acquisition, bankruptcy or other
            transaction in which that third party assumes control of our
            business (in whole or in part). Should one of these events occur, we
            will make reasonable efforts to notify you before your information
            becomes subject to different privacy and security policies and
            practices.
          </Text>

          <Heading py={5} as="h3" fontSize="2xl">
            Data that is Not Personal Data
          </Heading>

          <Text mb={10}>
            We may create aggregated, de-identified or anonymized data from the
            Personal Data we collect, including by removing information that
            makes the data personally identifiable to a particular user. We may
            use such aggregated, de-identified or anonymized data and share it
            with third parties for our lawful business purposes, including to
            analyze, build and improve the Services and promote our business,
            provided that we will not share such data in a manner that could
            identify you.
          </Text>

          <Heading py={5} fontWeight="extrabold" as="h1" fontSize="4xl">
            Tracking Tools and Opt-Out
          </Heading>

          <Text>
            The Services use cookies and similar technologies such as pixel
            tags, web beacons, clear GIFs and JavaScript (collectively,
            “Cookies”) to enable our servers to recognize your web browser, tell
            us how and when you visit and use our Services, analyze trends,
            learn about our user base and operate and improve our Services.
            Cookies are small pieces of data– usually text files – placed on
            your computer, tablet, phone or similar device when you use that
            device to access our Services.
            <br /> <br />
            We may also supplement the information we collect from you with
            information received from third parties, including third parties
            that have placed their own Cookies on your device(s). Please note
            that because of our use of Cookies, the Services do not support “Do
            Not Track” requests sent from a browser at this time.
            <br /> <br />
            We use the following types of Cookies:
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              <strong>Essential Cookies</strong>. Essential Cookies are required
              for providing you with features or services that you have
              requested. For example, certain Cookies enable you to log into
              secure areas of our Services. Disabling these Cookies may make
              certain features and services unavailable.
            </ListItem>
            <ListItem>
              <strong>Functional Cookies</strong>. Functional Cookies are used
              to record your choices and settings regarding our Services,
              maintain your preferences over time and recognize you when you
              return to our Services. These Cookies help us to personalize our
              content for you, greet you by name and remember your preferences
              (for example, your choice of language or region).
            </ListItem>
            <ListItem>
              <strong>Performance/Analytical Cookies</strong>.
              Performance/Analytical Cookies allow us to understand how visitors
              use our Services. They do this by collecting information about the
              number of visitors to the Services, what pages visitors view on
              our Services and how long visitors are viewing pages on the
              Services. Performance/Analytical Cookies also help us measure the
              performance of our advertising campaigns in order to help us
              improve our campaigns and the Services’ content for those who
              engage with our advertising. For example, Google Inc. (“Google”)
              uses cookies in connection with its Google Analytics services.
              Google’s ability to use and share information collected by Google
              Analytics about your visits to the Services is subject to the
              Google Analytics Terms of Use and the Google Privacy Policy. You
              have the option to opt-out of Google’s use of Cookies by visiting
              the Google advertising opt-out page at{' '}
              <Link
                href="www.google.com/privacy_ads.html"
                target="_blank"
                color="purple.500"
              >
                www.google.com/privacy_ads.html
              </Link>
              or the Google Analytics Opt-out Browser Add-on at{' '}
              <Link
                href="https://tools.google.com/dlpage/gaoptout/"
                target="_blank"
                color="purple.500"
              >
                https://tools.google.com/dlpage/gaoptout/
              </Link>
              .
            </ListItem>
          </UnorderedList>

          <Text mb={10}>
            You can decide whether or not to accept Cookies through your
            internet browser’s settings. Most browsers have an option for
            turning off the Cookie feature, which will prevent your browser from
            accepting new Cookies, as well as (depending on the sophistication
            of your browser software) allow you to decide on acceptance of each
            new Cookie in a variety of ways. You can also delete all Cookies
            that are already on your device. If you do this, however, you may
            have to manually adjust some preferences every time you visit our
            website and some of the Services and functionalities may not work.
            <br /> <br />
            To explore what Cookie settings are available to you, look in the
            “preferences” or “options” section of your browser’s menu. To find
            out more information about Cookies, including information about how
            to manage and delete Cookies, please visit{' '}
            <Link
              href="http://www.allaboutcookies.org/"
              target="_blank"
              color="purple.500"
            >
              http://www.allaboutcookies.org/
            </Link>
            .
          </Text>

          <Heading py={5} fontWeight="extrabold" as="h1" fontSize="4xl">
            Data Security and Retention
          </Heading>

          <Text mb={10}>
            We seek to protect your Personal Data from unauthorized access, use
            and disclosure using appropriate physical, technical, organizational
            and administrative security measures based on the type of Personal
            Data and how we are processing that data. You should also help
            protect your data by appropriately selecting and protecting your
            password and/or other sign-on mechanism; limiting access to your
            computer or device and browser; and signing off after you have
            finished accessing your account. Although we work to protect the
            security of your account and other data that we hold in our records,
            please be aware that no method of transmitting data over the
            internet or storing data is completely secure.
            <br /> <br />
            We retain Personal Data about you for as long as you have an open
            account with us or as otherwise necessary to provide you with our
            Services. In some cases we retain Personal Data for longer, if doing
            so is necessary to comply with our legal obligations, resolve
            disputes or collect fees owed, or is otherwise permitted or required
            by applicable law, rule or regulation. We may further retain
            information in an anonymous or aggregated form where that
            information would not identify you personally.
          </Text>

          <Heading py={5} fontWeight="extrabold" as="h1" fontSize="4xl">
            Data Security and Retention
          </Heading>

          <Text mb={10}>
            As noted in the Terms of Use, we do not knowingly collect or solicit
            Personal Data about children under 13 years of age; if you are a
            child under the age of 13, please do not attempt to register for or
            otherwise use the Services or send us any Personal Data. If we learn
            we have collected Personal Data from a child under 13 years of age,
            we will delete that information as quickly as possible. If you
            believe that a child under 13 years of age may have provided
            Personal Data to us, please contact us at{' '}
            <Link color="purple.500" href="mailto:">
              support@zipper.works
            </Link>{' '}
            .
          </Text>

          <Heading py={5} fontWeight="extrabold" as="h1" fontSize="4xl">
            California Resident Rights
          </Heading>

          <Text mb={10}>
            If you are a California resident, you have the rights set forth in
            this section. Please see the “Exercising Your Rights” section below
            for instructions regarding how to exercise these rights. Please note
            that we may process Personal Data of our customers’ end users or
            employees in connection with our provision of certain services to
            our customers. If we are processing your Personal Data as a service
            provider, you should contact the entity that collected your Personal
            Data in the first instance to address your rights with respect to
            such data.
            <br />
            <br />
            If there are any conflicts between this section and any other
            provision of this Privacy Policy and you are a California resident,
            the portion that is more protective of Personal Data shall control
            to the extent of such conflict. If you have any questions about this
            section or whether any of the following rights apply to you, please
            contact us at{' '}
            <Link color="purple.500" href="mailto:">
              support@zipper.works
            </Link>{' '}
            .
          </Text>

          <Heading py={5} as="h3" fontSize="2xl">
            Business Transfers
          </Heading>

          <Text>
            You have the right to request certain information about our
            collection and use of your Personal Data over the past 12 months. In
            response, we will provide you with the following information:
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              The categories of Personal Data that we have collected about you.
            </ListItem>
            <ListItem>
              The categories of sources from which that Personal Data was
              collected.
            </ListItem>
            <ListItem>
              The business or commercial purpose for collecting or selling your
              Personal Data.
            </ListItem>
            <ListItem>
              The categories of third parties with whom we have shared your
              Personal Data.
            </ListItem>
            <ListItem>
              The specific pieces of Personal Data that we have collected about
              you.
            </ListItem>
          </UnorderedList>

          <Text mb={10}>
            If we have disclosed your Personal Data to any third parties for a
            business purpose over the past 12 months, we will identify the
            categories of Personal Data shared with each category of third party
            recipient. If we have sold your Personal Data over the past 12
            months, we will identify the categories of Personal Data sold to
            each category of third party recipient.
          </Text>

          <Heading py={5} as="h3" fontSize="2xl">
            Deletion
          </Heading>

          <Text mb={10}>
            You have the right to request that we delete the Personal Data that
            we have collected about you. Under the CCPA, this right is subject
            to certain exceptions: for example, we may need to retain your
            Personal Data to provide you with the Services or complete a
            transaction or other action you have requested. If your deletion
            request is subject to one of these exceptions, we may deny your
            deletion request.
          </Text>

          <Heading py={5} as="h3" fontSize="2xl">
            Deletion
          </Heading>

          <Text>
            To exercise the rights described above, you or your Authorized Agent
            (defined below) must send us a request that (1) provides sufficient
            information to allow us to verify that you are the person about whom
            we have collected Personal Data (i.e. your name and login
            information), and (2) describes your request in sufficient detail to
            allow us to understand, evaluate and respond to it. Each request
            that meets both of these criteria will be considered a “Valid
            Request.” We may not respond to requests that do not meet these
            criteria. We will only use Personal Data provided in a Valid Request
            to verify your identity and complete your request. You do not need
            an account to submit a Valid Request.
            <br />
            <br />
            We will work to respond to your Valid Request within 45 days of
            receipt. We will not charge you a fee for making a Valid Request
            unless your Valid Request(s) is excessive, repetitive or manifestly
            unfounded. If we determine that your Valid Request warrants a fee,
            we will notify you of the fee and explain that decision before
            completing your request.
            <br />
            <br />
            You may submit a Valid Request using the following methods:
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              Email us at:{' '}
              <Link color="purple.500" href="mailto: support@zipper.works">
                support@zipper.works
              </Link>{' '}
            </ListItem>
          </UnorderedList>

          <Text mb={10}>
            You may also authorize an agent (an “Authorized Agent”) to exercise
            your rights on your behalf. To do this, you must provide your
            Authorized Agent with written permission to exercise your rights on
            your behalf, and we may request a copy of this written permission
            from your Authorized Agent when they make a request on your behalf.
          </Text>

          <Heading py={5} as="h3" fontSize="2xl">
            Personal Data Sales Opt-Out and Opt-In
          </Heading>

          <Text mb={10}>
            We will not sell your Personal Data, and have not done so over the
            last 12 months. To our knowledge, we do not sell the Personal Data
            of minors under 16 years of age.
          </Text>

          <Heading py={5} as="h3" fontSize="2xl">
            We Will Not Discriminate Against You for Exercising Your Rights
            Under the CCPA
          </Heading>

          <Text mb={10}>
            We will not discriminate against you for exercising your rights
            under the CCPA. We will not deny you our goods or services, charge
            you different prices or rates, or provide you a lower quality of
            goods and services if you exercise your rights under the CCPA.
            However, we may offer different tiers of our Services as allowed by
            applicable data privacy laws (including the CCPA) with varying
            prices, rates or levels of quality of the goods or services you
            receive related to the value of Personal Data that we receive from
            you.
          </Text>

          <Heading py={5} fontWeight="extrabold" as="h1" fontSize="4xl">
            Other State Law Privacy Rights
          </Heading>

          <Heading py={5} as="h3" fontSize="2xl">
            California Resident Rights
          </Heading>

          <Text mb={10}>
            Under California Civil Code Sections 1798.83-1798.84, California
            residents are entitled to contact us to prevent disclosure of
            Personal Data to third parties for such third parties’ direct
            marketing purposes; in order to submit such a request, please
            contact usmailto:at support@zipper.works.
          </Text>

          <Heading py={5} as="h3" fontSize="2xl">
            Nevada Resident Rights
          </Heading>

          <Text mb={10}>
            If you are a resident of Nevada, you have the right to opt-out of
            the sale of certain Personal Data to third parties who intend to
            license or sell that Personal Data. You can exercise this right by
            contactmailto:ng us at support@zipper.works with the subject line
            “Nevada Do Not Sell Request” and providing us with your name and the
            email address associated with your account. Please note that we do
            not currently sell your Personal Data as sales are defined in Nevada
            Revised Statutes Chapter 603A.
          </Text>

          <Heading py={5} fontWeight="extrabold" as="h1" fontSize="4xl">
            Changes to this Privacy Policy
          </Heading>

          <Text mb={10}>
            We’re constantly trying to improve our Services, so we may need to
            change this Privacy Policy from time to time, but we will alert you
            to any such changes by placing a notice on the Zipper website, by
            sending you an email and/or by some other means. Please note that if
            you’ve opted not to receive legal notice emails from us (or you
            haven’t provided us with your email address), those legal notices
            will still govern your use of the Services, and you are still
            responsible for reading and understanding them. If you use the
            Services after any changes to the Privacy Policy have been posted,
            that means you agree to all of the changes. Use of information we
            collect is subject to the Privacy Policy in effect at the time such
            information is collected.
          </Text>

          <Heading py={5} fontWeight="extrabold" as="h1" fontSize="4xl">
            Contact Information
          </Heading>

          <Text>
            If you have any questions or comments about this Privacy Policy, the
            ways in which we collect and use your Personal Data or your choices
            and rights regarding such collection and use, please do not hesitate
            to contact us at:
          </Text>

          <UnorderedList pl={10} py={2} fontSize="sm">
            <ListItem>
              <Link color="purple.500" href="#">
                http://www.zipper.works
              </Link>
            </ListItem>
            <ListItem>
              <Link color="purple.500" href="mailto: support@zipper.works">
                support@zipper.works
              </Link>
            </ListItem>
            <ListItem>
              7 Mount Lassen Drive, Unit A152, San Rafael CA 94903
            </ListItem>
          </UnorderedList>
        </Container>
      </Box>
      <Website.Footer hideAppletDemo links={{ component: NextLink }} />
    </>
  );
};

PrivacyPage.skipAuth = true;

export default PrivacyPage;
