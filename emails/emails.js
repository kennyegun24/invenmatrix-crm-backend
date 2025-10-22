const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const forgotPasswordMsg = ({ redirect_link, email, full_name }) => {
  return {
    to: email,
    from: {
      name: "InvenMatrix",
      email: "kennyegun241@gmail.com",
    },
    subject: "Password Reset Request",
    templateId: "d-959732a448574f5596efeca10e44631e", // your SendGrid template
    dynamicTemplateData: {
      redirect_link,
      full_name,
    },
  };
};

const verifyEmailMsg = ({ link, email }) => ({
  to: email,
  from: { name: "InvenMatrix", email: "kennyegun241@gmail.com" },
  subject: "Verify Your Email",
  templateId: "d-bdcfc239d67544f487a832be0f48b2c1",
  dynamicTemplateData: { link },
});

const lowStockAlertMsg = ({
  company_name,
  inventories,
  no_of_out_of_stock,
  email,
}) => {
  return {
    to: email,
    from: {
      name: "InvenMatrix",
      email: "kennyegun241@gmail.com",
    },
    // from: "test@example.com", // Use the email address or domain you verified above
    subject: "LOW STOCK ALERT!",
    templateId: "d-b5f02b77c77b480f8dc43b8e5be34ecb",
    dynamicTemplateData: {
      company_name,
      inventories,
      no_of_out_of_stock,
    },
  };
};

const newCommentMsg = ({
  comment_link,
  email,
  post_text,
  commentor_name,
  comment,
  year,
}) => ({
  to: email,
  from: { name: "InvenMatrix", email: "kennyegun241@gmail.com" },
  subject: "Someone commented on your request!",
  templateId: "d-3989aa45ab2245afb4d862071fc39e5c",
  dynamicTemplateData: {
    comment_link,
    post_text,
    commentor_name,
    comment,
    year,
  },
});

const sendNewTeamInviteMail = ({ email, organization, link }) => ({
  to: email,
  from: { name: "InvenMatrix", email: "kennyegun241@gmail.com" },
  subject: "Someone commented on your request!",
  templateId: "d-c7a00e4e18fb427b83688cf91ae5530a",
  dynamicTemplateData: {
    organization,
    link,
  },
});

const sendTeamInviteMail = ({ email, organization }) => ({
  to: email,
  from: { name: "InvenMatrix", email: "kennyegun241@gmail.com" },
  subject: "Someone commented on your request!",
  templateId: "d-df8683c71c0c4241afe3c1bd2d2bb677",
  dynamicTemplateData: {
    organization,
  },
});

module.exports = {
  forgotPasswordMsg,
  verifyEmailMsg,
  lowStockAlertMsg,
  sgMail,
  newCommentMsg,
  sendNewTeamInviteMail,
  sendTeamInviteMail,
};
