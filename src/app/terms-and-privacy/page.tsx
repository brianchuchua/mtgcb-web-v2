import { Box, Container, Paper, Typography } from '@mui/material';

export default function TermsAndPrivacyPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Terms and Privacy
      </Typography>

      <Paper sx={{ p: 3, mt: 3, backgroundColor: 'background.paper' }}>
        <Typography variant="h5" component="h2" gutterBottom>
          TL;DR Version
        </Typography>
        <Typography component="p" gutterBottom color="text.secondary">
          Before we get to the copy-pasted legal stuff, I just wanted to say that while I love using and developing this
          site, it needs to be treated like a starting point for a rough collection evaluation. Don't make any financial
          decisions based on it. There could be a bug lurking about, or TCGPlayer could have been having a bad day when
          prices got updated, or a vendor on the TCGPlayer side make a typo and the price is wrong for a low-inventory
          card. Some cards don't have any price data at all.
        </Typography>
        <Typography component="p" gutterBottom color="text.secondary">
          If you are buying or selling a collection, get it professionally appraised first. Nothing on this site
          constitutes financial advice.
        </Typography>
        <Typography component="p" gutterBottom color="text.secondary">
          I also respect every user's privacy. My database just stores the minimal amount of information necessary to
          assign a collection to a user, and I don't share this information with anyone. Passwords are encrypted and all
          that jazz.
        </Typography>
        <Typography component="p" gutterBottom color="text.secondary">
          With that said, enjoy the following legal verbiage almost no one reads:
        </Typography>
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Web Site Terms and Conditions of Use
        </Typography>

        <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
          1. Terms
        </Typography>
        <Typography component="p" gutterBottom>
          By accessing this web site, you are agreeing to be bound by these web site Terms and Conditions of Use, all
          applicable laws and regulations, and agree that you are responsible for compliance with any applicable local
          laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The
          materials contained in this web site are protected by applicable copyright and trade mark law.
        </Typography>

        <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
          2. Use License
        </Typography>
        <Typography component="p" gutterBottom>
          Permission is granted to temporarily download one copy of the materials (information or software) on MTG
          Collection Builder's web site for personal, non-commercial transitory viewing only. This is the grant of a
          license, not a transfer of title, and under this license you may not:
        </Typography>
        <Box component="ul" sx={{ pl: 3 }}>
          <li>
            <Typography>modify or copy the materials;</Typography>
          </li>
          <li>
            <Typography>
              use the materials for any commercial purpose, or for any public display (commercial or non-commercial);
            </Typography>
          </li>
          <li>
            <Typography>
              attempt to decompile or reverse engineer any software contained on MTG Collection Builder's web site;
            </Typography>
          </li>
          <li>
            <Typography>remove any copyright or other proprietary notations from the materials; or</Typography>
          </li>
          <li>
            <Typography>
              transfer the materials to another person or "mirror" the materials on any other server.
            </Typography>
          </li>
        </Box>
        <Typography component="p" gutterBottom>
          This license shall automatically terminate if you violate any of these restrictions and may be terminated by
          MTG Collection Builder at any time. Upon terminating your viewing of these materials or upon the termination
          of this license, you must destroy any downloaded materials in your possession whether in electronic or printed
          format.
        </Typography>

        <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
          3. Disclaimer
        </Typography>
        <Typography component="p" gutterBottom>
          The materials on MTG Collection Builder's web site are provided "as is". MTG Collection Builder makes no
          warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without
          limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or
          non-infringement of intellectual property or other violation of rights. Further, MTG Collection Builder does
          not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of
          the materials on its Internet web site or otherwise relating to such materials or on any sites linked to this
          site.
        </Typography>

        <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
          4. Limitations
        </Typography>
        <Typography component="p" gutterBottom>
          In no event shall MTG Collection Builder or its suppliers be liable for any damages (including, without
          limitation, damages for loss of data or profit, or due to business interruption,) arising out of the use or
          inability to use the materials on MTG Collection Builder's Internet site, even if MTG Collection Builder or a
          MTG Collection Builder authorized representative has been notified orally or in writing of the possibility of
          such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of
          liability for consequential or incidental damages, these limitations may not apply to you.
        </Typography>

        <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
          5. Revisions and Errata
        </Typography>
        <Typography component="p" gutterBottom>
          The materials appearing on MTG Collection Builder's web site could include technical, typographical, or
          photographic errors. MTG Collection Builder does not warrant that any of the materials on its web site are
          accurate, complete, or current. MTG Collection Builder may make changes to the materials contained on its web
          site at any time without notice. MTG Collection Builder does not, however, make any commitment to update the
          materials.
        </Typography>

        <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
          6. Links
        </Typography>
        <Typography component="p" gutterBottom>
          MTG Collection Builder has not reviewed all of the sites linked to its Internet web site and is not
          responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by
          MTG Collection Builder of the site. Use of any such linked web site is at the user's own risk.
        </Typography>

        <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
          7. Site Terms of Use Modifications
        </Typography>
        <Typography component="p" gutterBottom>
          MTG Collection Builder may revise these terms of use for its web site at any time without notice. By using
          this web site you are agreeing to be bound by the then current version of these Terms and Conditions of Use.
        </Typography>

        <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
          8. Governing Law
        </Typography>
        <Typography component="p" gutterBottom>
          Any claim relating to MTG Collection Builder's web site shall be governed by the laws of the State of
          California without regard to its conflict of law provisions.
        </Typography>
        <Typography component="p" gutterBottom>
          General Terms and Conditions applicable to Use of a Web Site.
        </Typography>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Privacy Policy
        </Typography>
        <Typography component="p" gutterBottom>
          Your privacy is very important to us. Accordingly, we have developed this Policy in order for you to
          understand how we collect, use, communicate and disclose and make use of personal information. The following
          outlines our privacy policy.
        </Typography>
        <Box component="ul" sx={{ pl: 3 }}>
          <li>
            <Typography>
              Before or at the time of collecting personal information, we will identify the purposes for which
              information is being collected.
            </Typography>
          </li>
          <li>
            <Typography>
              We will collect and use of personal information solely with the objective of fulfilling those purposes
              specified by us and for other compatible purposes, unless we obtain the consent of the individual
              concerned or as required by law.
            </Typography>
          </li>
          <li>
            <Typography>
              We will only retain personal information as long as necessary for the fulfillment of those purposes.
            </Typography>
          </li>
          <li>
            <Typography>
              We will collect personal information by lawful and fair means and, where appropriate, with the knowledge
              or consent of the individual concerned.
            </Typography>
          </li>
          <li>
            <Typography>
              Personal data should be relevant to the purposes for which it is to be used, and, to the extent necessary
              for those purposes, should be accurate, complete, and up-to-date.
            </Typography>
          </li>
          <li>
            <Typography>
              We will protect personal information by reasonable security safeguards against loss or theft, as well as
              unauthorized access, disclosure, copying, use or modification.
            </Typography>
          </li>
          <li>
            <Typography>
              We will make readily available to customers information about our policies and practices relating to the
              management of personal information.
            </Typography>
          </li>
        </Box>
        <Typography component="p" gutterBottom>
          We are committed to conducting our business in accordance with these principles in order to ensure that the
          confidentiality of personal information is protected and maintained.
        </Typography>
      </Box>
    </Container>
  );
}
