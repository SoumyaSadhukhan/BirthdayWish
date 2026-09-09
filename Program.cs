using Piu.Models;
using Piu.Services;

var builder = WebApplication.CreateBuilder(args);

// Strongly typed configuration using IOptions pattern
builder.Services.Configure<BirthdayConfig>(
    builder.Configuration.GetSection(BirthdayConfig.SectionName));

// Register domain services
builder.Services.AddSingleton<ImageService>();
builder.Services.AddSingleton<AudioService>();
builder.Services.AddScoped<BirthdayContentService>();

// Razor Pages
builder.Services.AddRazorPages();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}
else
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.MapRazorPages();

app.Run();
