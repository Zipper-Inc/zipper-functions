import {
  Box,
  Heading,
  Link,
  ListIcon,
  ListItem,
  OrderedList,
  Text,
} from '@chakra-ui/react';
import { Website } from '@zipper/ui';
import NextLink from 'next/link';

export default function TermsPage() {
  return (
    <Website>
      <Website.Navbar links={{ component: NextLink }} />
      <Box
        display="flex"
        flexDir="column"
        alignItems="start"
        as="main"
        w="full"
        margin="0 auto"
      >
        <Heading as="h1" fontFamily="plaak" fontWeight="900" fontSize="6xl">
          TERMS AND CONDITIONS
        </Heading>

        <Heading py={5} as="h2" fontSize="2xl">
          Effective as of July 9, 2021
        </Heading>

        <Text pb={5}>
          Welcome to Zipper. Please read on to learn the rules and restrictions
          that govern your use of our website(s), products, services and
          applications (the “Services”). If you have any questions, comments, or
          concerns regarding these terms or the Services, please contact us at{' '}
          <Link color="purple.500" href="#">
            support@zipper.works
          </Link>
          .
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
          <Link color="purple.500" href="#">
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
          Zipper takes the privacy of its users very seriously. For the current
          Zipper Privacy Policy, please{' '}
          <Link as={NextLink} color="purple.500" href="/privacy">
            click here
          </Link>
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
          <Link href="#" color="purple.500">
            support@zipper.works.
          </Link>
        </Text>

        <Heading as="h3" fontSize="lg" py={2}>
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

        <Heading as="h3" fontSize="lg" py={2}>
          What about messaging?
        </Heading>

        <Text mb={10}>
          As part of the Services, you may receive communications through the
          Services, including messages that Zipper sends you (for example, via
          email). When signing up for the Services, you will receive a welcome
          message and instructions on how to stop receiving messages.
        </Text>

        <Heading as="h3" fontSize="lg" py={2}>
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
            <ListItem key={index}>{item}</ListItem>
          ))}
        </OrderedList>
      </Box>
      {/* <Website.Footer links={{ component: NextLink }} /> */}
    </Website>
  );
}
