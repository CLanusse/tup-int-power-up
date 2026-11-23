function PageHeader({ eyebrow, title, description, action }) {
  return (
    <section className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {typeof description === "string" ? <p>{description}</p> : description}
      </div>
      {action}
    </section>
  );
}

export default PageHeader;
